import { Transform, Type } from "class-transformer"
import { ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min, ValidateNested } from "class-validator"
import { Trim } from "../../../../common/transformers/trim.transformer"
import { spice_level_enum } from "../../../../generated/prisma/enums"
import { MenuItemIngredientDto } from "./menu-item-ingredient.dto"

export class CreateMenuItemDto {
    @IsUUID('4')
    categoryId!: string

    @MaxLength(150)
    @IsString()
    @IsNotEmpty()
    @Transform(Trim)
    name!: string

    @IsOptional()
    @IsString()
    description?: string

    @Min(1)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    price!: number

    @IsOptional()
    @IsEnum(spice_level_enum)
    spiceLevel?: spice_level_enum

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean

    @IsOptional()
    @IsInt()
    @IsPositive()
    servesCount?: number

    @IsInt()
    @IsPositive()
    @Min(1)
    @IsOptional()
    preparationTimeMinutes?: number

    @Type(() => MenuItemIngredientDto)
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @IsArray()
    @ArrayUnique((ingredients: MenuItemIngredientDto) => ingredients.ingredientId)
    ingredients!: MenuItemIngredientDto[]

    @IsUUID('4')
    @IsOptional()
    @ArrayUnique()
    @IsArray()
    specializationIds?: string[]
}