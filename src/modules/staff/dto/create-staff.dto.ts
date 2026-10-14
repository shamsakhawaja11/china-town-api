import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { staff_type_enum } from '../../../generated/prisma/enums';
import { Trim } from '../../../common/transformers/trim.transformer';

export class CreateStaffDto {
    @IsUUID()
    userId!: string;

    @IsUUID()
    restaurantId!: string;

    @IsEnum(staff_type_enum)
    staffType!: staff_type_enum;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @Transform(Trim)
    position?: string;
}