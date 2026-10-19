import { IsDefined, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator"
import { ingredient_component_enum } from "../../../../generated/prisma/enums"

export class MenuItemIngredientDto {

    @IsUUID('4')
    ingredientId!: string

    @IsOptional()
    @IsEnum(ingredient_component_enum)
    component?: ingredient_component_enum

    @IsPositive()
    @IsNumber({ maxDecimalPlaces: 3 })
    quantityRequired!: number
}