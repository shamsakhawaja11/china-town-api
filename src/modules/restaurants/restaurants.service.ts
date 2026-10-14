import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

type RestaurantRow = Prisma.restaurantsGetPayload<object>;

@Injectable()
export class RestaurantsService {
    constructor(private prismaService: PrismaService) { }

    async getAllPublic() {
        const branches = await this.prismaService.restaurants.findMany({
            where: { is_active: true },
            orderBy: { name: 'asc' },
        });
        return branches.map((b) => this.toResponse(b));
    }

    async getOnePublic(id: string) {
        const branch = await this.findOrThrow(id);
        if (!branch.is_active) {
            throw new NotFoundException('Branch not found');
        }
        return this.toResponse(branch);
    }

    async getAllAdmin() {
        const branches = await this.prismaService.restaurants.findMany({
            orderBy: { name: 'asc' },
        });
        return branches.map((b) => this.toResponse(b));
    }

    async getOneAdmin(id: string) {
        const branch = await this.findOrThrow(id);
        return this.toResponse(branch);
    }

    async create(dto: CreateRestaurantDto) {
        this.assertValidRules(dto.opening_time, dto.closing_time, dto.latitude ?? null, dto.longitude ?? null);

        const branch = await this.prismaService.restaurants.create({
            data: {
                name: dto.name,
                description: dto.description ?? null,
                address: dto.address,
                latitude: dto.latitude ?? null,
                longitude: dto.longitude ?? null,
                phone: dto.phone ?? null,
                opening_time: this.toTimeDate(dto.opening_time),
                closing_time: this.toTimeDate(dto.closing_time),
            },
        });
        return this.toResponse(branch);
    }

    async update(id: string, dto: UpdateRestaurantDto) {
        if (Object.values(dto).every((value) => value === undefined)) {
            throw new BadRequestException('No fields provided to update');
        }

        const existing = await this.findOrThrow(id);

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
        if (dto.is_active !== undefined) data.is_active = dto.is_active;
        if (dto.opening_time !== undefined) data.opening_time = this.toTimeDate(dto.opening_time);
        if (dto.closing_time !== undefined) data.closing_time = this.toTimeDate(dto.closing_time);

        const updated = await this.prismaService.restaurants.update({
            where: { id },
            data,
        });
        return this.toResponse(updated);
    }


    private async findOrThrow(id: string): Promise<RestaurantRow> {
        const branch = await this.prismaService.restaurants.findUnique({ where: { id } });
        if (!branch) {
            throw new NotFoundException('Branch not found');
        }
        return branch;
    }

    private assertValidRules(opening: string, closing: string, latitude: number | null, longitude: number | null) {

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

    private toResponse(branch: RestaurantRow) {
        return {
            id: branch.id,
            name: branch.name,
            description: branch.description,
            address: branch.address,
            latitude: this.toNumber(branch.latitude),
            longitude: this.toNumber(branch.longitude),
            phone: branch.phone,
            opening_time: this.fromTimeDate(branch.opening_time),
            closing_time: this.fromTimeDate(branch.closing_time),
            is_active: branch.is_active,
            created_at: branch.created_at,
            updated_at: branch.updated_at,
        };
    }
}