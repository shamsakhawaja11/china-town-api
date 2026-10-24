import { Controller, Get } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('restaurant')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) { }

    @Public()
    @Get()
    get() {
        return this.restaurantsService.getRestaurant();
    }
}