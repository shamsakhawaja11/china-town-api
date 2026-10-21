import { Transform } from "class-transformer";
import { ArrayUnique, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from "class-validator"
import { Trim } from "../../../../common/transformers/trim.transformer";

export class CreateIngredientDto {


    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    @Transform(Trim)
    name!: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    @Transform(Trim)
    unit!: string

    @IsBoolean()
    isVegetarian!: boolean

    @IsBoolean()
    isVegan!: boolean

    @IsOptional()
    @IsArray({ message: 'allergens ids must be an array' })
    @ArrayUnique({ message: 'duplicate allergens ids are not allowed' })
    @IsUUID('4', { each: true, message: 'Each allergens id must be UUID' })
    allergenIds?: string[]
}