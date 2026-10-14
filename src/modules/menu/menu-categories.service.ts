import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMenuCategoryDto } from "./dto/create-menu-category.dto";
import { UpdateMenuCategoryDto } from "./dto/update-menu-category.dto";

@Injectable()
export class MenuCategoriesService {
    constructor(private prismaService: PrismaService) { }

    async findAllActive(restaurantId?: string) {
        return this.prismaService.menu_categories.findMany({
            where: {
                is_active: true,
                restaurant_id: restaurantId, 
            },
            orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
        });
    }

    async create(dto: CreateMenuCategoryDto) {
        return this.prismaService.menu_categories.create({
            data: {
                restaurant_id: dto.restaurantId,
                name: dto.name,
                display_order: dto.displayOrder,
                description: dto.description,
            },
        });
    }

    async update(id: string, dto: UpdateMenuCategoryDto) {
        return this.prismaService.menu_categories.update({
            where: { id },
            data: {
                name: dto.name,
                display_order: dto.displayOrder,
                description: dto.description,
                is_active: dto.isActive,
            },
        });
    }
}