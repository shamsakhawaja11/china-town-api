import { Transform, Type } from "class-transformer"
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator"
import { Trim } from "../../../../common/transformers/trim.transformer"

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
}