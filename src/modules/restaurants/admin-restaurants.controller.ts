import { Body, Controller, Patch } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/restaurant')
@Roles('admin')
export class RestaurantsAdminController {
    constructor(private readonly restaurantsService: RestaurantsService) { }

    @Patch()
    update(@Body() dto: UpdateRestaurantDto) {
        return this.restaurantsService.update(dto);
    }
}