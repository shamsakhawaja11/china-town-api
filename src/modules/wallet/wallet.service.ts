import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { wallet_transaction_type_enum } from '../../generated/prisma/enums';
import { round2, toNum } from '../../common/utils/money';
import { paginate } from '../../common/dto/pagination-query.dto';
import { TopUpWalletDto } from './dto/top-up-wallet.dto';

type Tx = Prisma.TransactionClient;

type WalletMovement = {
    paymentId?: string;
    reservationId?: string;
    description?: string;
    idempotencyKey?: string;
};

/**
 * Wallet balance is only ever changed inside a DB transaction with the wallet
 * row locked (SELECT ... FOR UPDATE), and every change writes a
 * wallet_transactions row with balance_before / balance_after, which the
 * wallet_transaction_balance_chk constraint double-checks.
 */
@Injectable()
export class WalletService {
    constructor(private readonly prisma: PrismaService) { }

    private async lock(tx: Tx, userId: string) {
        await tx.wallets.upsert({
            where: { user_id: userId },
            create: { user_id: userId },
            update: {},
        });
        await tx.$queryRaw`SELECT id FROM wallets WHERE user_id = ${userId}::uuid FOR UPDATE`;
        const wallet = await tx.wallets.findUniqueOrThrow({ where: { user_id: userId } });
        if (!wallet.is_active) {
            throw new BadRequestException('Wallet is disabled');
        }
        return wallet;
    }

    async debit(tx: Tx, userId: string, amount: number, movement: WalletMovement) {
        return this.move(tx, userId, amount, 'debit', movement);
    }

    async credit(
        tx: Tx,
        userId: string,
        amount: number,
        type: Exclude<wallet_transaction_type_enum, 'debit'>,
        movement: WalletMovement,
    ) {
        return this.move(tx, userId, amount, type, movement);
    }

    private async move(
        tx: Tx,
        userId: string,
        rawAmount: number,
        type: wallet_transaction_type_enum,
        movement: WalletMovement,
    ) {
        const amount = round2(rawAmount);
        if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

        const wallet = await this.lock(tx, userId);
        const before = toNum(wallet.balance);
        const after = round2(type === 'debit' ? before - amount : before + amount);
        if (after < 0) {
            throw new BadRequestException(
                `Insufficient wallet balance (available Rs ${before.toFixed(2)}, needed Rs ${amount.toFixed(2)})`,
            );
        }

        await tx.wallets.update({
            where: { id: wallet.id },
            data: { balance: after, updated_at: new Date() },
        });
        return tx.wallet_transactions.create({
            data: {
                wallet_id: wallet.id,
                transaction_type: type,
                amount,
                balance_before: before,
                balance_after: after,
                payment_id: movement.paymentId,
                reservation_id: movement.reservationId,
                description: movement.description,
                idempotency_key: movement.idempotencyKey,
            },
        });
    }

    async getWallet(userId: string) {
        const wallet = await this.prisma.wallets.upsert({
            where: { user_id: userId },
            create: { user_id: userId },
            update: {},
        });
        return {
            id: wallet.id,
            balance: toNum(wallet.balance),
            isActive: wallet.is_active,
            updatedAt: wallet.updated_at,
        };
    }

    async transactions(userId: string, page: number, limit: number) {
        const wallet = await this.prisma.wallets.findUnique({ where: { user_id: userId } });
        if (!wallet) return paginate([], 0, page, limit);

        const where = { wallet_id: wallet.id };
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.wallet_transactions.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: { payments: { select: { order_id: true, method: true } } },
            }),
            this.prisma.wallet_transactions.count({ where }),
        ]);
        return paginate(
            rows.map((row) => ({
                id: row.id,
                type: row.transaction_type,
                amount: toNum(row.amount),
                balanceBefore: toNum(row.balance_before),
                balanceAfter: toNum(row.balance_after),
                description: row.description,
                orderId: row.payments?.order_id ?? null,
                reservationId: row.reservation_id,
                createdAt: row.created_at,
            })),
            total,
            page,
            limit,
        );
    }

    /**
     * Add money to the wallet with a card. There is no real gateway in this
     * project, so the card charge is simulated and always succeeds.
     * Send the same idempotencyKey again and you get the same result back
     * instead of a double top-up.
     */
    async topUp(userId: string, dto: TopUpWalletDto) {
        const idempotencyKey = dto.idempotencyKey ? `topup:${userId}:${dto.idempotencyKey}` : undefined;

        if (idempotencyKey) {
            const existing = await this.prisma.wallet_transactions.findUnique({
                where: { idempotency_key: idempotencyKey },
            });
            if (existing) {
                return { transactionId: existing.id, balance: toNum(existing.balance_after), duplicate: true };
            }
        }

        try {
            const txn = await this.prisma.$transaction((tx) =>
                this.credit(tx, userId, dto.amount, 'credit', {
                    description: `Top-up by card${dto.cardLast4 ? ` •••• ${dto.cardLast4}` : ''} (ref ${randomUUID().slice(0, 8)})`,
                    idempotencyKey,
                }),
            );
            return { transactionId: txn.id, balance: toNum(txn.balance_after), duplicate: false };
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new ConflictException('This top-up was already processed');
            }
            throw err;
        }
    }
}
