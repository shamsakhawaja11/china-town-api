import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { Public } from "../../../common/decorators/public.decorator";
import { MenuItemsService } from "./menu-item.service";
import { ListMenuItemsQueryDto } from "./dto/list-menu-items-query.dto";

@Public()
@Controller('menu/items')
export class MenuItemsPublicController {

    constructor(private menuItemsService: MenuItemsService) { }

    @Get()
    findPublic(@Query() query: ListMenuItemsQueryDto) {
        return this.menuItemsService.findPublic(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.menuItemsService.findPublicOne(id);
    }
}