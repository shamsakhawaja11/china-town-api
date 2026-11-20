import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { staff_type_enum } from '../../generated/prisma/enums';
import { paginate } from '../../common/dto/pagination-query.dto';

type Db = PrismaService | Prisma.TransactionClient;

export type NotificationInput = {
    type: string;
    title: string;
    message: string;
};

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async notifyUser(userId: string, input: NotificationInput, db: Db = this.prisma) {
        await db.notifications.create({
            data: { user_id: userId, type: input.type, title: input.title, message: input.message },
        });
    }

    async notifyManagement(input: NotificationInput, staffTypes: staff_type_enum[] = ['manager'], db: Db = this.prisma) {
        const [admins, staff] = await Promise.all([
            db.users.findMany({ where: { role: 'admin', is_active: true }, select: { id: true } }),
            staffTypes.length
                ? db.staff.findMany({
                    where: { is_active: true, staff_type: { in: staffTypes } },
                    select: { user_id: true },
                })
                : Promise.resolve([] as { user_id: string }[]),
        ]);
        const userIds = [...new Set([...admins.map((a) => a.id), ...staff.map((s) => s.user_id)])];
        if (userIds.length === 0) return;
        await db.notifications.createMany({
            data: userIds.map((user_id) => ({
                user_id,
                type: input.type,
                title: input.title,
                message: input.message,
            })),
        });
    }

    safe(promise: Promise<unknown>) {
        promise.catch((err) => this.logger.warn(`Notification failed: ${String(err)}`));
    }

    async list(userId: string, page: number, limit: number, unreadOnly?: boolean) {
        const where: Prisma.notificationsWhereInput = {
            user_id: userId,
            ...(unreadOnly ? { is_read: false } : {}),
        };
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.notifications.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notifications.count({ where }),
        ]);
        return paginate(
            rows.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                isRead: n.is_read,
                readAt: n.read_at,
                createdAt: n.created_at,
            })),
            total,
            page,
            limit,
        );
    }

    async unreadCount(userId: string) {
        const count = await this.prisma.notifications.count({ where: { user_id: userId, is_read: false } });
        return { unread: count };
    }

    async markRead(userId: string, id: string) {
        const result = await this.prisma.notifications.updateMany({
            where: { id, user_id: userId, is_read: false },
            data: { is_read: true, read_at: new Date() },
        });
        if (result.count === 0) {
            const exists = await this.prisma.notifications.count({ where: { id, user_id: userId } });
            if (!exists) throw new NotFoundException('Notification not found');
        }
        return { success: true };
    }

    async markAllRead(userId: string) {
        const result = await this.prisma.notifications.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true, read_at: new Date() },
        });
        return { updated: result.count };
    }
}
