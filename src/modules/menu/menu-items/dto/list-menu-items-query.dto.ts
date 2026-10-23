import { Transform, Type } from "class-transformer"
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateIf } from "class-validator"
import { Trim } from "../../../../common/transformers/trim.transformer"
import { spice_level_enum } from "../../../../generated/prisma/enums"
import { ToBoolean } from "../../../../common/transformers/to-transformer.boolean"

export class ListMenuItemsQueryDto {

    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @IsInt()
    page: number = 1

    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    @IsInt()
    limit: number = 20

    @IsOptional()
    @IsUUID('4')
    categoryId?: string

    @Transform(Trim)
    @MaxLength(150)
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    search?: string

    @Type(() => Number)
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    minPrice?: number

    @Type(() => Number)
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    maxPrice?: number

    @IsOptional()
    @IsEnum(spice_level_enum)
    spiceLevel?:spice_level_enum

    @IsOptional()
    @Transform(ToBoolean)
    isVegetarian?:boolean

    @IsOptional()
    @Transform(ToBoolean)
    isVegan?:boolean
}