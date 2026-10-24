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
        return this.toResponse(restaurant);
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
        };
    }
}