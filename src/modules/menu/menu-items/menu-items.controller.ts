import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CreateMenuItemDto } from "./dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto";
import { MenuItemsService } from "./menu-item.service";
@Roles('admin')
@Controller('admin/menu/items')
export class MenuItemsController {
    constructor(private menuItemService: MenuItemsService) { }

    @Post()
    create(@Body() dto: CreateMenuItemDto) {
        return this.menuItemService.create(dto);
    }

    @Get()
    findAll() {
        return this.menuItemService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.menuItemService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuItemDto) {
        return this.menuItemService.update(id, dto)
    }
}