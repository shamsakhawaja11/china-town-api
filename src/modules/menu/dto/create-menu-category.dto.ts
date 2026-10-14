import { Transform } from "class-transformer"
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator"
import { Trim } from "../../../common/transformers/trim.transformer"

export class CreateMenuCategoryDto {

    @IsUUID()
    restaurantId!: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Transform(Trim)
    name!: string

    @IsString()
    @IsOptional()
    description?: string

    @IsInt()
    @IsOptional()
    @Min(0)
    displayOrder?: number
}