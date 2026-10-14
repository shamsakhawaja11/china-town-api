import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { RestaurantsService } from "./restaurants.service";
import { Public } from "../../common/decorators/public.decorator";

@Controller('restaurants')
export class RestaurantsController {
    constructor(private restaurantsService: RestaurantsService) { }

    @Public()
    @Get()
    getAll() {
        return this.restaurantsService.getAllPublic();
    }

    @Public()
    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.restaurantsService.getOnePublic(id);
    }
}