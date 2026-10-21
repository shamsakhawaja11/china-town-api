import { Module } from '@nestjs/common';
import { SpecializationsService } from './specializations.service';
import { AdminSpecializationsController } from './specializations.controller';

@Module({
  providers: [SpecializationsService],
  controllers:[AdminSpecializationsController]
})
export class SpecializationsModule { }
