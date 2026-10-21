import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { RestaurantsService } from "./restaurants.service";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller('admin/restaurants')
export class AdminRestaurantsController {
    constructor(private restaurantsService: RestaurantsService) { }

    @Roles('admin')
    @Get()
    getAll() {
        return this.restaurantsService.getAllAdmin();
    }

    @Roles('admin')
    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.restaurantsService.getOneAdmin(id);
    }

    @Roles('admin')
    @Post()
    create(@Body() dto: CreateRestaurantDto) {
        return this.restaurantsService.create(dto);
    }

    @Roles('admin')
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRestaurantDto) {
        return this.restaurantsService.update(id, dto);
    }
}