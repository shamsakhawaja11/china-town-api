import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { MenuCategoriesService } from "./menu-categories.service";
import { Public } from "../../common/decorators/public.decorator";
import { CreateMenuCategoryDto } from "./dto/create-menu-category.dto";
import { UpdateMenuCategoryDto } from "./dto/update-menu-category.dto";

@Controller('/menu/categories')
export class MenuCategoriesController {
    constructor(private menuCategoriesService: MenuCategoriesService) { }

    @Public()
    @Get()
    getAll(@Query('restaurantId', new ParseUUIDPipe({ optional: true })) restaurantId?: string) {
        return this.menuCategoriesService.findAllActive(restaurantId);
    }

    @Post()
    create(@Body() dto: CreateMenuCategoryDto) {
        return this.menuCategoriesService.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateMenuCategoryDto) {
        return this.menuCategoriesService.update(id, dto);
    }
}