import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";

@Injectable()
export class RestaurantService {
    constructor(private prismaService: PrismaService) { }

    async getAllPublic() {
        return await this.prismaService.restaurants.findMany({ where: { is_active: true }, orderBy: { name: 'desc' } });
    }

    async getOnePublic(id: string) {
        const branch = await this.prismaService.restaurants.findUnique({ where: { id } });
        if (!branch || !branch.is_active)
            throw new NotFoundException('Branch not found');
        return branch;
    }

    async getAllAdmin() {
        return await this.prismaService.restaurants.findMany({ orderBy: { name: 'desc' } });
    }

    async getOneAdmin(id: string) {
        const branch = await this.prismaService.restaurants.findUnique({ where: { id } });
        if (!branch)
            throw new NotFoundException('Branch not found');
        return branch;
    }

    async create(dto: CreateRestaurantDto) {
        if (dto.closing_time < dto.opening_time) {
            throw new BadRequestException('Closing time is before opening time');
        }

        return await this.prismaService.restaurants.create({ data: dto });
    }
    async update(id: string, dto: UpdateRestaurantDto) {
        if (dto?.closing_time < dto?.opening_time) {
            return new BadRequestException('Closing time is before opening time');
        }
        return await this.prismaService.restaurants.update({ where: { id }, data: dto });
    }






}