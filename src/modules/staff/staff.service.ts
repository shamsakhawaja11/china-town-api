import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { Prisma } from '../../generated/prisma/client';
import { ListStaffQueryDto } from './dto/list-staff-query.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { UsersService } from '../users/users.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import * as argon2 from 'argon2';

const STAFF_INCLUDE = {
    users: { select: { name: true, email: true, phone: true } },
    staff_specializations: { include: { food_specializations: { select: { id: true, name: true } } } },
} satisfies Prisma.staffInclude;

type StaffWithUser = Prisma.staffGetPayload<{ include: typeof STAFF_INCLUDE }>;

@Injectable()
export class StaffService {
    constructor(
        private prismaService: PrismaService,
        private usersService: UsersService,
        private restaurantsService: RestaurantsService,
    ) { }

    private async assertSpecializations(ids: string[]) {
        if (ids.length === 0) return;
        const count = await this.prismaService.food_specializations.count({ where: { id: { in: ids }, is_active: true } });
        if (count !== ids.length) throw new BadRequestException('One or more specializations do not exist or are inactive');
    }

    /** "Add chef / staff" screen: creates the login and the staff profile together. */
    async createWithAccount(dto: CreateStaffAccountDto) {
        const specializationIds = dto.specializationIds ?? [];
        await this.assertSpecializations(specializationIds);
        const restaurantId = dto.restaurantId ?? (await this.restaurantsService.getDefaultRestaurant()).id;

        const user = await this.usersService.create(dto.name, await argon2.hash(dto.password), dto.email, dto.phone);
        try {
            const staff = await this.prismaService.$transaction(async (tx) => {
                await tx.users.update({ where: { id: user.id }, data: { role: 'staff' } });
                return tx.staff.create({
                    data: {
                        user_id: user.id,
                        restaurant_id: restaurantId,
                        staff_type: dto.staffType,
                        position: dto.position,
                        staff_specializations: {
                            createMany: { data: specializationIds.map((specialization_id) => ({ specialization_id })) },
                        },
                    },
                    include: STAFF_INCLUDE,
                });
            });
            return this.toResponse(staff);
        } catch (err) {
            // don't leave a half-created login behind
            await this.prismaService.users.delete({ where: { id: user.id } }).catch(() => undefined);
            throw err;
        }
    }

    async replaceSpecializations(id: string, specializationIds: string[]) {
        await this.findOrThrow(id);
        await this.assertSpecializations(specializationIds);
        await this.prismaService.$transaction([
            this.prismaService.staff_specializations.deleteMany({ where: { staff_id: id } }),
            this.prismaService.staff_specializations.createMany({
                data: specializationIds.map((specialization_id) => ({ staff_id: id, specialization_id })),
            }),
        ]);
        return this.getOne(id);
    }

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
            specializations: staff.staff_specializations.map((s) => s.food_specializations),
        };
    }
}