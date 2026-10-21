import { Body, Controller, Get, Param, ParseEnumPipe, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { IngredientsService } from "./ingredients.service";
import { UpdateIngredientDto } from "./dto/update-ingredient.dto";
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { Roles } from "../../../common/decorators/roles.decorator";

@Roles('admin')
@Controller('admin/ingredients')
export class IngredientController {
    constructor(private ingredients:IngredientsService) { }

    @Post()
    create(@Body()dto: CreateIngredientDto) {
        return this.ingredients.create(dto);    
    }

    @Get()
    findAll() {
        return this.ingredients.findAll();
    }
    
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe)id: string) {
        return this.ingredients.findOne(id);
    }

    @Patch('id')
    update(@Param('id', ParseEnumPipe)id:string,@Body()dto:UpdateIngredientDto) {
        return this.ingredients.update(id,dto);
    }
}