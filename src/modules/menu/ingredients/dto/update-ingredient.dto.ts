import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateIngredientDto } from './create-ingredient.dto';

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}