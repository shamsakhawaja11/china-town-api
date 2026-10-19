import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

const ingredientInclude = {
    ingredient_allergens: {
        include: { allergens: { select: { id: true, name: true } } },
    },
} satisfies Prisma.ingredientsInclude;

type IngredientWithAllergens = Prisma.ingredientsGetPayload<{
    include: typeof ingredientInclude;
}>;

@Injectable()
export class IngredientsService {
    constructor(private readonly prisma: PrismaService) { }

    private toResponse(ingredient: IngredientWithAllergens) {
        const { ingredient_allergens, ...rest } = ingredient;
        return {
            ...rest,
            allergens: ingredient_allergens.map((ia) => ia.allergens),
        };
    }

    async create(dto: CreateIngredientDto) {
        if (dto.isVegan && !dto.isVegetarian) {
            throw new BadRequestException('Vegan ingredient must also be vegetarian');
        }

        const allergenIds = dto.allergenIds ?? [];
        if (allergenIds.length > 0) {
            const count = await this.prisma.allergens.count({
                where: { id: { in: allergenIds } },
            });
            if (count !== allergenIds.length) {
                throw new BadRequestException('One or more allergen ids do not exist');
            }
        }

        try {
            const ingredient = await this.prisma.ingredients.create({
                data: {
                    name: dto.name,
                    unit: dto.unit,
                    is_vegetarian: dto.isVegetarian,
                    is_vegan: dto.isVegan,
                    ingredient_allergens: {
                        createMany: {
                            data: allergenIds.map((allergen_id) => ({ allergen_id })),
                        },
                    },
                },
                include: ingredientInclude,
            });
            return this.toResponse(ingredient);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Ingredient name already exists');
            }
            throw error;
        }
    }

    async findAll() {
        const ingredients = await this.prisma.ingredients.findMany({
            include: ingredientInclude,
            orderBy: { name: 'asc' },
        });
        return ingredients.map((i) => this.toResponse(i));
    }

    async findOne(id: string) {
        const ingredient = await this.prisma.ingredients.findUnique({
            where: { id },
            include: ingredientInclude,
        });
        if (!ingredient) {
            throw new NotFoundException('Ingredient not found');
        }
        return this.toResponse(ingredient);
    }

    async update(id: string, dto: UpdateIngredientDto) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const existing = await tx.ingredients.findUnique({ where: { id } });
                if (!existing) {
                    throw new NotFoundException('Ingredient not found');
                }

                const isVegetarian = dto.isVegetarian ?? existing.is_vegetarian;
                const isVegan = dto.isVegan ?? existing.is_vegan;
                if (isVegan && !isVegetarian) {
                    throw new BadRequestException('Vegan ingredient must also be vegetarian');
                }

                const allergenIds = dto.allergenIds;
                if (allergenIds !== undefined && allergenIds.length > 0) {
                    const count = await tx.allergens.count({
                        where: { id: { in: allergenIds } },
                    });
                    if (count !== allergenIds.length) {
                        throw new BadRequestException('One or more allergen ids do not exist');
                    }
                }

                await tx.ingredients.update({
                    where: { id },
                    data: {
                        name: dto.name,
                        unit: dto.unit,
                        is_vegetarian: dto.isVegetarian,
                        is_vegan: dto.isVegan,
                        is_active: dto.isActive,
                    },
                });

                if (allergenIds !== undefined) {
                    await tx.ingredient_allergens.deleteMany({
                        where: { ingredient_id: id },
                    });
                    if (allergenIds.length > 0) {
                        await tx.ingredient_allergens.createMany({
                            data: allergenIds.map((allergen_id) => ({
                                ingredient_id: id,
                                allergen_id,
                            })),
                        });
                    }
                }

                const updated = await tx.ingredients.findUniqueOrThrow({
                    where: { id },
                    include: ingredientInclude,
                });
                return this.toResponse(updated);
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Ingredient name already exists');
            }
            throw error;
        }
    }
}