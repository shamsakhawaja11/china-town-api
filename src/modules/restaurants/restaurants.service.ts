import { BadRequestException, Injectable, InternalServerErrorException, } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

type RestaurantRow = Prisma.restaurantsGetPayload<object>;

@Injectable()
export class RestaurantsService {
    constructor(private prismaService: PrismaService) { }

    async getDefaultRestaurant(): Promise<RestaurantRow> {
        const restaurant = await this.prismaService.restaurants.findFirst({
            where: { is_active: true },
            orderBy: { created_at: 'asc' },
        });
        if (!restaurant) {
            throw new InternalServerErrorException('Restaurant is not configured');
        }
        return restaurant;
    }

    async getRestaurant() {
        const restaurant = await this.getDefaultRestaurant();
        const rating = await this.prismaService.restaurant_reviews.aggregate({
            _avg: { rating: true },
            _count: { _all: true },
        });
        return {
            ...this.toResponse(restaurant),
            rating: Math.round((rating._avg.rating ?? 0) * 10) / 10,
            review_count: rating._count._all,
        };
    }

    async update(dto: UpdateRestaurantDto) {
        if (Object.values(dto).every((value) => value === undefined)) {
            throw new BadRequestException('No fields provided to update');
        }

        const existing = await this.getDefaultRestaurant();

        const opening = dto.opening_time ?? this.fromTimeDate(existing.opening_time);
        const closing = dto.closing_time ?? this.fromTimeDate(existing.closing_time);
        const latitude =
            dto.latitude !== undefined ? dto.latitude : this.toNumber(existing.latitude);
        const longitude =
            dto.longitude !== undefined ? dto.longitude : this.toNumber(existing.longitude);

        this.assertValidRules(opening, closing, latitude, longitude);

        const data: Prisma.restaurantsUpdateInput = { updated_at: new Date() };
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.address !== undefined) data.address = dto.address;
        if (dto.latitude !== undefined) data.latitude = dto.latitude;
        if (dto.longitude !== undefined) data.longitude = dto.longitude;
        if (dto.phone !== undefined) data.phone = dto.phone;
        if (dto.opening_time !== undefined) data.opening_time = this.toTimeDate(dto.opening_time);
        if (dto.closing_time !== undefined) data.closing_time = this.toTimeDate(dto.closing_time);
        if (dto.image_url !== undefined) data.image_url = dto.image_url;

        const updated = await this.prismaService.restaurants.update({
            where: { id: existing.id },
            data,
        });
        return this.toResponse(updated);
    }

    private assertValidRules(
        opening: string,
        closing: string,
        latitude: number | null,
        longitude: number | null,
    ) {
        if (closing <= opening) {
            throw new BadRequestException('Closing time must be after opening time');
        }

        if ((latitude === null) !== (longitude === null)) {
            throw new BadRequestException(
                'Latitude and longitude must be provided together',
            );
        }
    }

    private toTimeDate(time: string): Date {
        return new Date(`1970-01-01T${time}:00.000Z`);
    }

    private fromTimeDate(date: Date): string {
        return date.toISOString().slice(11, 16);
    }

    private toNumber(value: Prisma.Decimal | null): number | null {
        return value === null ? null : value.toNumber();
    }

    private toResponse(restaurant: RestaurantRow) {
        return {
            id: restaurant.id,
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address,
            latitude: this.toNumber(restaurant.latitude),
            longitude: this.toNumber(restaurant.longitude),
            phone: restaurant.phone,
            opening_time: this.fromTimeDate(restaurant.opening_time),
            closing_time: this.fromTimeDate(restaurant.closing_time),
            is_active: restaurant.is_active,
            created_at: restaurant.created_at,
            updated_at: restaurant.updated_at,
            image_url: restaurant.image_url
        };
    }
    async getTablesSummary() {
        const restaurant = await this.getDefaultRestaurant();

        const [totalTables, categories] = await Promise.all([
            this.prismaService.restaurant_tables.count({
                where: { restaurant_id: restaurant.id, is_active: true },
            }),
            this.prismaService.table_categories.findMany({
                where: {
                    restaurant_id: restaurant.id,
                    is_active: true,
                },
                orderBy: { display_order: 'asc' },
                select: { name: true },
            }),
        ]);

        return {
            total_tables: totalTables,
            categories: categories.map((category) => category.name),
        };
    }


    async getLiveTables() {
        const restaurant = await this.getDefaultRestaurant();
        const now = new Date();
        const soon = new Date(now.getTime() + 60 * 60000);
        const [plan, tables, busyOrders, busyBookings] = await Promise.all([
            this.prismaService.floor_plans.findFirst({
                where: { restaurant_id: restaurant.id, is_active: true, is_default: true },
            }),
            this.prismaService.restaurant_tables.findMany({
                where: { restaurant_id: restaurant.id, is_active: true },
                include: { table_categories: { select: { id: true, name: true } } },
                orderBy: { table_number: 'asc' },
            }),
            this.prismaService.orders.findMany({
                where: { table_id: { not: null }, status: { in: ['pending', 'accepted', 'preparing', 'ready', 'served'] } },
                select: { table_id: true },
            }),
            this.prismaService.$queryRaw<{ table_id: string }[]>`
                SELECT DISTINCT rt.table_id FROM reservation_tables rt
                JOIN reservations r ON r.id = rt.reservation_id
                WHERE rt.is_active AND r.status IN ('confirmed','seated')
                  AND rt.during && tstzrange(${now}::timestamptz, ${soon}::timestamptz, '[)')`,
        ]);
        const busy = new Set([...busyOrders.map((o) => o.table_id), ...busyBookings.map((b) => b.table_id)]);
        return {
            floorPlan: plan
                ? { id: plan.id, name: plan.name, canvasWidth: plan.canvas_width, canvasHeight: plan.canvas_height, backgroundUrl: plan.background_url }
                : null,
            tables: tables.map((t) => ({
                id: t.id,
                tableNumber: t.table_number,
                capacity: t.capacity,
                category: t.table_categories,
                posX: t.pos_x.toNumber(),
                posY: t.pos_y.toNumber(),
                width: t.width.toNumber(),
                height: t.height.toNumber(),
                rotation: t.rotation.toNumber(),
                isAvailable: !busy.has(t.id),
                fitsParty: true,
            })),
        };
    }
}
