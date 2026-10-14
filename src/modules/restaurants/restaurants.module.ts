import { Module } from "@nestjs/common";
import { RestaurantsController } from "./restaurants.controller";
import { AdminRestaurantsController } from "./admin-restaurants.controller";
import { RestaurantsService } from "./restaurants.service";

@Module({
    imports: [],
    controllers: [RestaurantsController, AdminRestaurantsController],
    providers: [RestaurantsService],
    exports: []
})
export class RestaurantsModule { }