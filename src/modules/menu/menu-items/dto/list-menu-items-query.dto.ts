import { Type } from "class-transformer"
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator"

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
}