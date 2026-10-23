import { BadRequestException, Injectable, NotFoundException, Search } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ReplaceMenuItemIngredientsDto } from './dto/replace-menu-item-ingredients.dto';
import { ReplaceMenuItemSpecializationsDto } from './dto/replace-menu-item-specializations.dto';
import { ListMenuItemsQueryDto } from './dto/list-menu-items-query.dto';

const menuItemInclude = {
    menu_categories: { select: { id: true, name: true } },
    menu_item_ingredients: {
        include: {
            ingredients: {
                include: {
                    ingredient_allergens: {
                        include: { allergens: { select: { id: true, name: true } } },
                    },
                },
            },
        },
    },
    menu_item_specializations: {
        include: { food_specializations: { select: { id: true, name: true } } },
    },
} satisfies Prisma.menu_itemsInclude;

type MenuItemFull = Prisma.menu_itemsGetPayload<{
    include: typeof menuItemInclude;
}>;

@Injectable()
export class MenuItemsService {
    constructor(private readonly prisma: PrismaService) { }

    private toResponse(item: MenuItemFull) {
        const {
            menu_categories,
            menu_item_ingredients,
            menu_item_specializations,
            ...rest
        } = item;

        const ingredientRows = menu_item_ingredients.map((row) => row.ingredients);


        const isVegetarian =
            ingredientRows.length > 0 && ingredientRows.every((i) => i.is_vegetarian);
        const isVegan =
            ingredientRows.length > 0 && ingredientRows.every((i) => i.is_vegan);

        const allergens = [
            ...new Set(
                ingredientRows.flatMap((i) =>
                    i.ingredient_allergens.map((ia) => ia.allergens.name),
                ),
            ),
        ].sort();

        return {
            ...rest,
            category: menu_categories,
            ingredients: menu_item_ingredients.map((row) => ({
                id: row.ingredients.id,
                name: row.ingredients.name,
                unit: row.ingredients.unit,
                component: row.component,
                quantityRequired: row.quantity_required,
            })),
            specializations: menu_item_specializations.map(
                (row) => row.food_specializations,
            ),
            isVegetarian,
            isVegan,
            allergens,
        };
    }

    private async assertActiveCategory(categoryId: string) {
        const category = await this.prisma.menu_categories.findFirst({
            where: { id: categoryId, is_active: true },
            select: { id: true },
        });
        if (!category) {
            throw new BadRequestException('Category does not exist or is inactive');
        }
    }

    async create(dto: CreateMenuItemDto) {
        await this.assertActiveCategory(dto.categoryId);

        const ingredientIds = dto.ingredients.map((i) => i.ingredientId);
        const ingredientCount = await this.prisma.ingredients.count({
            where: { id: { in: ingredientIds }, is_active: true },
        });
        if (ingredientCount !== ingredientIds.length) {
            throw new BadRequestException(
                'One or more ingredients do not exist or are inactive',
            );
        }

        const specializationIds = dto.specializationIds ?? [];
        if (specializationIds.length > 0) {
            const specCount = await this.prisma.food_specializations.count({
                where: { id: { in: specializationIds }, is_active: true },
            });
            if (specCount !== specializationIds.length) {
                throw new BadRequestException(
                    'One or more specializations do not exist or are inactive',
                );
            }
        }


        const created = await this.prisma.menu_items.create({
            data: {
                category_id: dto.categoryId,
                name: dto.name,
                description: dto.description,
                price: dto.price,
                spice_level: dto.spiceLevel,
                is_available: dto.isAvailable,
                preparation_time_minutes: dto.preparationTimeMinutes,
                serves_count: dto.servesCount,
                menu_item_ingredients: {
                    createMany: {
                        data: dto.ingredients.map((item) => ({
                            ingredient_id: item.ingredientId,
                            component: item.component,
                            quantity_required: item.quantityRequired,
                        })),
                    },
                },
                menu_item_specializations: {
                    createMany: {
                        data: specializationIds.map((specialization_id) => ({
                            specialization_id,
                        })),
                    },
                },
            },
            include: menuItemInclude,
        });

        return this.toResponse(created);
    }

    async findAll() {
        const items = await this.prisma.menu_items.findMany({
            include: menuItemInclude,
            orderBy: { name: 'asc' },
        });
        return items.map((item) => this.toResponse(item));
    }

    async findOne(id: string) {
        const item = await this.prisma.menu_items.findUnique({
            where: { id },
            include: menuItemInclude,
        });
        if (!item) {
            throw new NotFoundException('Menu item not found');
        }
        return this.toResponse(item);
    }

    async update(id: string, dto: UpdateMenuItemDto) {
        const existing = await this.prisma.menu_items.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existing) {
            throw new NotFoundException('Menu item not found');
        }

        if (dto.categoryId !== undefined) {
            await this.assertActiveCategory(dto.categoryId);
        }

        const updated = await this.prisma.menu_items.update({
            where: { id },
            data: {
                category_id: dto.categoryId,
                name: dto.name,
                description: dto.description,
                price: dto.price,
                spice_level: dto.spiceLevel,
                is_available: dto.isAvailable,
                preparation_time_minutes: dto.preparationTimeMinutes,
                serves_count: dto.servesCount,
            },
            include: menuItemInclude,
        });

        return this.toResponse(updated);
    }

    async replaceIngredients(id: string, dto: ReplaceMenuItemIngredientsDto) {
        await this.prisma.$transaction(async (tx) => {
            const item = await tx.menu_items.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!item) {
                throw new NotFoundException('Menu item not found');
            }

            const ingredientIds = dto.ingredients.map((i) => i.ingredientId);
            const ingredientCount = await tx.ingredients.count({
                where: { id: { in: ingredientIds }, is_active: true },
            });
            if (ingredientCount !== ingredientIds.length) {
                throw new BadRequestException(
                    'One or more ingredients do not exist or are inactive',
                );
            }

            await tx.menu_item_ingredients.deleteMany({
                where: { menu_item_id: id },
            });

            await tx.menu_item_ingredients.createMany({
                data: dto.ingredients.map((i) => ({
                    menu_item_id: id,
                    ingredient_id: i.ingredientId,
                    component: i.component,
                    quantity_required: i.quantityRequired,
                })),
            });
        });

        return this.findOne(id);
    }
    async replaceSpecializations(id: string, dto: ReplaceMenuItemSpecializationsDto) {
        const specializationIds = dto.specializationIds;

        await this.prisma.$transaction(async (tx) => {
            const item = await tx.menu_items.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!item) {
                throw new NotFoundException('Menu item not found');
            }

            if (specializationIds.length > 0) {
                const count = await tx.food_specializations.count({
                    where: { id: { in: specializationIds }, is_active: true },
                });
                if (count !== specializationIds.length) {
                    throw new BadRequestException(
                        'One or more specializations do not exist or are inactive',
                    );
                }
            }

            await tx.menu_item_specializations.deleteMany({
                where: { menu_item_id: id },
            });

            if (specializationIds.length > 0) {
                await tx.menu_item_specializations.createMany({
                    data: specializationIds.map((specialization_id) => ({
                        menu_item_id: id,
                        specialization_id,
                    })),
                });
            }
        });

        return this.findOne(id);
    }

    async findPublic(query: ListMenuItemsQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const search = query.search?.trim();

        const where: Prisma.menu_itemsWhereInput = {
            is_available: true,
            menu_categories: { is_active: true },
            category_id: query.categoryId,
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [rows, total] = await this.prisma.$transaction([
            this.prisma.menu_items.findMany({
                where,
                include: menuItemInclude,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.menu_items.count({ where }),
        ]);

        return {
            items: rows.map((row) => this.toResponse(row)),
            page,
            limit,
            total,
            hasNextPage: page * limit < total,
        };
    }
}