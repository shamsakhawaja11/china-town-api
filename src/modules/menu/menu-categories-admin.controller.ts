import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { MenuCategoriesService } from "./menu-categories.service";
import { CreateMenuCategoryDto } from "./dto/create-menu-category.dto";
import { UpdateMenuCategoryDto } from "./dto/update-menu-category.dto";
import { Roles } from "../../common/decorators/roles.decorator";
@Roles('admin')
@Controller('/admin/menu/categories')
export class MenuCategoriesAdminController {
    constructor(private menuCategoriesService: MenuCategoriesService) { }

    @Post()
    create(@Body() dto: CreateMenuCategoryDto) {
        return this.menuCategoriesService.create(dto);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuCategoryDto) {
        return this.menuCategoriesService.update(id, dto);
    }
}