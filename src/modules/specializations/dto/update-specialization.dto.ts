import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSpecializationDto } from './create-specialization.dto';

export class UpdateSpecializationDto extends PartialType(
  CreateSpecializationDto,
) {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}   