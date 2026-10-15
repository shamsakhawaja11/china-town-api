import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class IngredientsService {
    constructor(private readonly prisma: PrismaService) { }

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
                include: {
                    ingredient_allergens: {
                        include: { allergens: { select: { id: true, name: true } } },
                    },
                },
            });

            const { ingredient_allergens, ...rest } = ingredient;
            return {
                ...rest,
                allergens: ingredient_allergens.map((ia) => ia.allergens),
            };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Ingredient name already exists');
            }
            throw error;
        }
    }
}