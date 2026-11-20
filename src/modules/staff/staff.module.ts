import { Module } from "@nestjs/common";
import { AdminStaffController } from "./admin-staff.controller";
import { StaffService } from "./staff.service";
import { UsersModule } from "../users/users.module";
import { RestaurantsModule } from "../restaurants/restaurants.module";

@Module({
    imports: [UsersModule, RestaurantsModule],
    controllers: [AdminStaffController],
    providers: [StaffService],
    exports: []

})
export class StaffModule { }