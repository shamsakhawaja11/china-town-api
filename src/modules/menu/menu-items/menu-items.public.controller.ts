import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../../common/decorators/public.decorator";
import { MenuItemsService } from "./menu-item.service";
import { ListMenuItemsQueryDto } from "./dto/list-menu-items-query.dto";

@Public()
@Controller('menu/items')
export class MenuItemsPublicController {

    constructor(private menuItemsService: MenuItemsService) { }

    @Get('menu/items')
    findPublic(@Query() query: ListMenuItemsQueryDto) {
        return this.menuItemsService.findPublic(query);
    }
}