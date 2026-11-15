import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { FloorPlansService } from './floor-plans.service';
import { CreateFloorPlanDto } from './dto/create-floor-plan.dto';
import { UpdateFloorPlanDto } from './dto/update-floor-plan.dto';

@Controller('admin/floor-plans')
@Roles('admin')
export class FloorPlansAdminController {
    constructor(private readonly floorPlansService: FloorPlansService) { }

    @Post()
    create(@Body() dto: CreateFloorPlanDto) {
        return this.floorPlansService.create(dto);
    }

    @Get()
    getAll() {
        return this.floorPlansService.getAll(true);
    }

    @Get(':id')
    getOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.floorPlansService.getOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateFloorPlanDto,
    ) {
        return this.floorPlansService.update(id, dto);
    }

    @Patch(':id/default')
    setDefault(@Param('id', ParseUUIDPipe) id: string) {
        return this.floorPlansService.setDefault(id);
    }
}