import { Transform } from "class-transformer"
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min,} from "class-validator"
import { Trim } from "../../../../common/transformers/trim.transformer"

export class CreateTableCategoryDto {

    @IsNotEmpty()
    @Transform(Trim)
    @MaxLength(50)
    @IsString()
    name!:string

    @IsOptional()
    @IsString()
    description?:string

    @IsOptional()
    @Min(0)
    @IsInt()
    displayOrder?:number
}