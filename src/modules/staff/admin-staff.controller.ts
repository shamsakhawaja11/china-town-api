import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from "@nestjs/common";
import { StaffService } from "./staff.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { ListStaffQueryDto } from "./dto/list-staff-query.dto";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateStaffDto } from "./dto/update-staff.dto";
import { CreateStaffAccountDto } from "./dto/create-staff-account.dto";
import { ReplaceMenuItemSpecializationsDto } from "../menu/menu-items/dto/replace-menu-item-specializations.dto";

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

    /** Create the login + staff profile in one step. */
    @Post('new')
    createWithAccount(@Body() dto: CreateStaffAccountDto) {
        return this.staffService.createWithAccount(dto);
    }

    @Put(':id/specializations')
    replaceSpecializations(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplaceMenuItemSpecializationsDto) {
        return this.staffService.replaceSpecializations(id, dto.specializationIds);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id:string,@Body()dto:UpdateStaffDto) {
        return this.staffService.update(id,dto);
    }


}