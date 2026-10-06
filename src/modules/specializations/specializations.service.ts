import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';

@Injectable()
export class SpecializationsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateSpecializationDto) {
        const specialization = await this.prisma.food_specializations.create({ data: dto });

        return specialization;
    }
    async findAll() {
        const specializations = await this.prisma.food_specializations.findMany({ where: { is_active: true } });
        return specializations;
    }
    async findOne(id: string) {
        const specialization = await this.prisma.food_specializations.findUniqueOrThrow({ where: { id } })
        return specialization;

    }
    async update(id: string, dto: UpdateSpecializationDto) {
        const updateSpecialization = await this.prisma.food_specializations.update({ where: { id }, data: dto });
        return updateSpecialization;
    }
}
