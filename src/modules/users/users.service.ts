import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeContact } from '../../common/utils/normalize-contact';
import { PrismaClientKnownRequestError } from '../../generated/prisma/internal/prismaNamespace';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { toNum } from '../../common/utils/money';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    private normalizeField(raw: string | undefined | null, expected: 'email' | 'phone'): string | undefined {
        if (raw === undefined || raw === null || raw.trim() === '') {
            return undefined;
        }
        const result = normalizeContact(raw);
        if (!result || result.type !== expected) {
            throw new BadRequestException(`Invalid ${expected}`);
        }
        return result.value;
    }

    async create(name: string, hashPassword: string, email?: string, phone?: string) {
        const normalizedEmail = this.normalizeField(email, 'email');
        const normalizedPhone = this.normalizeField(phone, 'phone');

        if (!normalizedEmail && !normalizedPhone) {
            throw new BadRequestException('Either email or phone is required');
        }

        try {
            return await this.prisma.users.create({
                data: {
                    name,
                    password_hash: hashPassword,
                    email: normalizedEmail,
                    phone: normalizedPhone
                },
                omit: { password_hash: true },
            });
        } catch (err: any) {
            if (err instanceof PrismaClientKnownRequestError && err?.code === 'P2002') {
                throw new ConflictException('An account with these details already exists');
            }
            throw err;
        }
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        if (Object.values(dto).every((v) => v === undefined)) {
            throw new BadRequestException('No fields provided to update');
        }
        const email = this.normalizeField(dto.email, 'email');
        const phone = this.normalizeField(dto.phone, 'phone');
        try {
            return await this.prisma.users.update({
                where: { id: userId },
                data: { name: dto.name, email, phone, updated_at: new Date() },
                select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
            });
        } catch (err: any) {
            if (err instanceof PrismaClientKnownRequestError && err?.code === 'P2002') {
                throw new ConflictException('This email or phone is already used by another account');
            }
            throw err;
        }
    }

    /** Profile screen: user + a few counters. */
    async profile(userId: string) {
        const [user, orders, activeOrders, reservations, reviews, wallet] = await Promise.all([
            this.prisma.users.findUniqueOrThrow({
                where: { id: userId },
                select: { id: true, name: true, email: true, phone: true, role: true, created_at: true },
            }),
            this.prisma.orders.count({ where: { customer_id: userId, status: 'completed' } }),
            this.prisma.orders.count({
                where: { customer_id: userId, status: { in: ['pending', 'accepted', 'preparing', 'ready', 'served'] } },
            }),
            this.prisma.reservations.count({
                where: { customer_id: userId, status: { in: ['pending', 'confirmed'] }, reservation_time: { gte: new Date() } },
            }),
            this.prisma.restaurant_reviews.count({ where: { customer_id: userId } }),
            this.prisma.wallets.findUnique({ where: { user_id: userId } }),
        ]);
        return {
            ...user,
            stats: {
                completedOrders: orders,
                activeOrders,
                upcomingReservations: reservations,
                reviews,
                walletBalance: toNum(wallet?.balance ?? 0),
            },
        };
    }
}
