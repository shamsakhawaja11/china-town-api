import { Module } from "@nestjs/common";
import { RestaurantsController } from "./restaurants.controller";
import { RestaurantsService } from "./restaurants.service";
import { RestaurantsAdminController } from "./admin-restaurants.controller";


@Module({
    imports: [],
    controllers: [RestaurantsController, RestaurantsAdminController],
    providers: [RestaurantsService],
    exports: [RestaurantsService]
})
export class RestaurantsModule { }