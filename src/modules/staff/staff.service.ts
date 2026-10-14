import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { Prisma } from '../../generated/prisma/client';
import { ListStaffQueryDto } from './dto/list-staff-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

const STAFF_INCLUDE = {
    users: { select: { name: true, email: true, phone: true } },
} satisfies Prisma.staffInclude;

type StaffWithUser = Prisma.staffGetPayload<{ include: typeof STAFF_INCLUDE }>;

@Injectable()
export class StaffService {
    constructor(private prismaService: PrismaService) { }

    async create(dto: CreateStaffDto) {
        try {
            const result = await this.prismaService.$transaction(async (tx) => {
                const user = await tx.users.findUnique({ where: { id: dto.userId } });

                if (!user) throw new NotFoundException('User not found');
                if (!user.is_active) throw new BadRequestException('User is not active');
                if (user.role === 'admin') throw new BadRequestException("An admin can't be turned into staff");
                if (user.role === 'staff') {
                    throw new ConflictException('User is already staff. To re-hire, reactivate them instead');
                }

                const branch = await tx.restaurants.findUnique({ where: { id: dto.restaurantId } });

                if (!branch) throw new NotFoundException('Restaurant branch not found');
                if (!branch.is_active) throw new BadRequestException('Branch is not active');

                await tx.users.update({ where: { id: user.id }, data: { role: 'staff' } });

                const staff = await tx.staff.create({
                    data: {
                        user_id: dto.userId,
                        restaurant_id: dto.restaurantId,
                        staff_type: dto.staffType,
                        position: dto.position,
                    },
                    include: STAFF_INCLUDE,
                });

                await tx.refresh_tokens.updateMany({
                    where: { user_id: user.id, revoked_at: null },
                    data: { revoked_at: new Date() },
                });

                return staff;
            });

            return this.toResponse(result);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new ConflictException('This user is already a staff member');
            }
            throw err;
        }
    }

    async getOne(id: string) {
        const staff = await this.findOrThrow(id);
        return this.toResponse(staff);
    }

    async list(query: ListStaffQueryDto) {
        const staff = await this.prismaService.staff.findMany({
            where: {
                restaurant_id: query.restaurantId,
                staff_type: query.staffType,
                is_active: query.isActive,
            },
            include: STAFF_INCLUDE,
            orderBy: { created_at: 'desc' },
        });
        return staff.map((item) => this.toResponse(item));
    }

    async update(id: string, dto: UpdateStaffDto) {
        if (Object.values(dto).every((value) => value === undefined)) {
            throw new BadRequestException('No fields provided to update');
        }

        const existing = await this.findOrThrow(id);

        const updated = await this.prismaService.$transaction(async (tx) => {
            const staff = await tx.staff.update({
                where: { id },
                data: {
                    staff_type: dto.staffType,
                    position: dto.position,
                    is_active: dto.isActive,
                },
                include: STAFF_INCLUDE,
            });

            if (dto.isActive !== undefined) {
                await tx.users.update({
                    where: { id: existing.user_id },
                    data: { is_active: dto.isActive },
                });

                if (dto.isActive === false) {
                    await tx.refresh_tokens.updateMany({
                        where: { user_id: existing.user_id, revoked_at: null },
                        data: { revoked_at: new Date() },
                    });
                }
            }

            return staff;
        });

        return this.toResponse(updated);
    }

    private async findOrThrow(id: string) {
        const staff = await this.prismaService.staff.findUnique({
            where: { id },
            include: STAFF_INCLUDE,
        });
        if (!staff) throw new NotFoundException('Staff not found');
        return staff;
    }

    private toResponse(staff: StaffWithUser) {
        return {
            id: staff.id,
            name: staff.users.name,
            email: staff.users.email,
            phone: staff.users.phone,
            restaurantId: staff.restaurant_id,
            staffType: staff.staff_type,
            position: staff.position,
            isAvailable: staff.is_available,
            isActive: staff.is_active,
        };
    }
}