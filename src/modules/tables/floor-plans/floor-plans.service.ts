import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { RestaurantsService } from '../../restaurants/restaurants.service';
import { CreateFloorPlanDto } from './dto/create-floor-plan.dto';
import { UpdateFloorPlanDto } from './dto/update-floor-plan.dto';

@Injectable()
export class FloorPlansService {
    constructor(private readonly prisma: PrismaService, private readonly restaurantService: RestaurantsService) { }


    private toConflict(error: unknown): never {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
        ) {
            const target = String(error.meta?.target ?? '');
            if (target.includes('name')) {
                throw new ConflictException('Floor plan name already exists');
            }
            throw new ConflictException(
                'Another floor plan was changed at the same time, please try again',
            );
        }
        throw error;
    }

    async create(dto: CreateFloorPlanDto) {
        const restaurant = await this.restaurantService.getDefaultRestaurant();

        const activeCount = await this.prisma.floor_plans.count({
            where: { restaurant_id: restaurant.id, is_active: true },
        });

        try {
            return await this.prisma.floor_plans.create({
                data: {
                    restaurant_id: restaurant.id,
                    name: dto.name,
                    canvas_width: dto.canvasWidth,
                    canvas_height: dto.canvasHeight,
                    is_default: activeCount === 0,
                },
            });
        } catch (error) {
            this.toConflict(error);
        }
    }

    async getAll(includeInactive = false) {
        const restaurant = await this.restaurantService.getDefaultRestaurant();

        return this.prisma.floor_plans.findMany({
            where: {
                restaurant_id: restaurant.id,
                ...(includeInactive ? {} : { is_active: true }),
            },
            orderBy: [{ is_default: 'desc' }, { name: 'asc' }, { id: 'asc' }],
        });
    }

    async getOne(id: string) {
        const plan = await this.prisma.floor_plans.findUnique({ where: { id } });
        if (!plan) {
            throw new NotFoundException('Floor plan not found');
        }
        return plan;
    }

    async update(id: string, dto: UpdateFloorPlanDto) {
        const existing = await this.getOne(id);

        if (dto.name !== undefined && dto.name !== existing.name) {
            const duplicate = await this.prisma.floor_plans.findFirst({
                where: {
                    restaurant_id: existing.restaurant_id,
                    name: dto.name,
                    id: { not: id },
                },
                select: { id: true },
            });
            if (duplicate) {
                throw new ConflictException('Floor plan name already exists');
            }
        }

        if (dto.canvasWidth !== undefined || dto.canvasHeight !== undefined) {
            const width = dto.canvasWidth ?? existing.canvas_width;
            const height = dto.canvasHeight ?? existing.canvas_height;

            const tables = await this.prisma.restaurant_tables.findMany({
                where: { floor_plan_id: id, is_active: true },
                select: {
                    table_number: true,
                    pos_x: true,
                    pos_y: true,
                    width: true,
                    height: true,
                },
            });
            const outside = tables.filter(
                (t) =>
                    t.pos_x.toNumber() + t.width.toNumber() > width ||
                    t.pos_y.toNumber() + t.height.toNumber() > height,
            );
            if (outside.length > 0) {
                throw new BadRequestException(
                    `These tables would no longer fit: ${outside
                        .map((t) => t.table_number)
                        .join(', ')}`,
                );
            }
        }

        if (dto.isActive === false && existing.is_active) {
            if (existing.is_default) {
                throw new BadRequestException(
                    'Set another floor plan as default before deactivating this one',
                );
            }
            const activeTables = await this.prisma.restaurant_tables.count({
                where: { floor_plan_id: id, is_active: true },
            });
            if (activeTables > 0) {
                throw new BadRequestException(
                    'Deactivate or move the tables on this floor plan first',
                );
            }
        }

        try {
            return await this.prisma.floor_plans.update({
                where: { id },
                data: {
                    name: dto.name,
                    canvas_width: dto.canvasWidth,
                    canvas_height: dto.canvasHeight,
                    is_active: dto.isActive,
                },
            });
        } catch (error) {
            this.toConflict(error);
        }
    }

    
    async setDefault(id: string) {
        return this.prisma.$transaction(async (tx) => {
            const plan = await tx.floor_plans.findUnique({ where: { id } });
            if (!plan) {
                throw new NotFoundException('Floor plan not found');
            }
            if (!plan.is_active) {
                throw new BadRequestException('An inactive floor plan cannot be the default');
            }
            if (plan.is_default) {
                return plan;
            }

            await tx.floor_plans.updateMany({
                where: { restaurant_id: plan.restaurant_id, is_default: true },
                data: { is_default: false },
            });
            return tx.floor_plans.update({
                where: { id },
                data: { is_default: true },
            });
        });
    }
}