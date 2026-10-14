import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateMenuCategoryDto } from "./create-menu-category.dto";
import { IsBoolean, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateMenuCategoryDto extends PartialType(
    OmitType(CreateMenuCategoryDto, ['restaurantId'] as const)
) { 
   
}