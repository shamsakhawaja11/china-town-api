import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { SpecializationsService } from './specializations.service';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';

@Controller('specializations')
export class SpecializationsController {
    constructor(private readonly specializationService:SpecializationsService) {}

    @Post()
    async create(@Body() dto:CreateSpecializationDto) {
        return this.specializationService.create(dto)
    }
    @Get()
    async findAll() {
        return this.specializationService.findAll();
    }
    @Get(':id')
    async findOne(@Param('id',ParseUUIDPipe) id :string) {
        return this.specializationService.findOne(id);
    }
    @Patch(':id')
    async update(@Param('id',ParseUUIDPipe)id:string,@Body() dto:UpdateSpecializationDto){
        return this.specializationService.update(id,dto);
    }
}
