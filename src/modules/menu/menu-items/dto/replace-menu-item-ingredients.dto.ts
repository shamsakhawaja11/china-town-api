import { Type } from "class-transformer";
import { MenuItemIngredientDto } from "./menu-item-ingredient.dto";
import { ArrayMinSize, ArrayUnique, IsArray, ValidateNested } from "class-validator";

export class ReplaceMenuItemIngredientsDto {
    @Type(() => MenuItemIngredientDto)
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @IsArray()
    @ArrayUnique((ingredient: MenuItemIngredientDto) => ingredient.ingredientId)
    ingredients!: MenuItemIngredientDto[]
}