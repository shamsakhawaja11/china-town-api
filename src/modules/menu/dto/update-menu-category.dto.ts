import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateMenuCategoryDto } from "./create-menu-category.dto";
import { IsBoolean, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateMenuCategoryDto extends PartialType(
    OmitType(CreateMenuCategoryDto, ['restaurantId'] as const)
) { 
    @IsBoolean()
    @IsOptional()
    @Transform(({value})=>{
        if(value === 'true') return true;
        if(value === 'false') return false;
        return value
    })
    isActive?:boolean
}