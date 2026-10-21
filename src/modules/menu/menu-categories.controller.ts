import { Controller, Get, ParseUUIDPipe, Query } from "@nestjs/common";
import { MenuCategoriesService } from "./menu-categories.service";
import { Public } from "../../common/decorators/public.decorator";

@Controller('/menu/categories')
export class MenuCategoriesController {
    constructor(private menuCategoriesService: MenuCategoriesService) { }

    @Public()
    @Get()
    getAll(@Query('restaurantId', new ParseUUIDPipe({ optional: true })) restaurantId?: string) {
        return this.menuCategoriesService.findAllActive(restaurantId);
    }


}