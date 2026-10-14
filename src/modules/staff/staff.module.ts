import { Module } from "@nestjs/common";
import { AdminStaffController } from "./admin-staff.controller";
import { StaffService } from "./staff.service";

@Module({
    imports: [],
    controllers: [AdminStaffController],
    providers: [StaffService],
    exports: []

})
export class StaffModule { }