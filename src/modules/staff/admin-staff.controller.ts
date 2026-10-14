import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { StaffService } from "./staff.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { ListStaffQueryDto } from "./dto/list-staff-query.dto";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";

@Roles('admin')
@Controller('admin/staff')
export class AdminStaffController{
    constructor(private staffService:StaffService) {}

    @Get()
    getAll(@Query()dto:ListStaffQueryDto){
        return this.staffService.list(dto);
    }

    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe)id:string ) {
        return this.staffService.getOne(id);
    }

    @Post()
    create(@Body() dto:CreateStaffDto) {
        return this.staffService.create(dto);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id:string,@Body()dto:UpdateStaffDto) {
        return this.staffService.update(id,dto);
    }


}