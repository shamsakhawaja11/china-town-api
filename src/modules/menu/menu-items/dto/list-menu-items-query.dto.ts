import { Transform, Type } from "class-transformer"
import { IsIn, IsInt, IsOptional, IsUUID, Max, MaxLength, Min } from "class-validator"
import { Trim } from "../../../../common/transformers/trim.transformer"

export class ListMenuItemsQueryDto{

    @IsOptional()
    @Type(()=>Number    )
    @Min(1)
    @IsInt()
    page:number= 1

    @IsOptional()
    @Type(()=>Number)
    @Min(1)
    @Max(50)
    @IsInt()
    limit:number= 20
    
    @IsOptional()
    @IsUUID('4')
    categoryId?:string

    @Transform(Trim)
    @MaxLength(150)
    @IsOptional()
    search?:string
}