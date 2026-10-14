import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { staff_type_enum } from '../../../generated/prisma/enums';

export class ListStaffQueryDto {
    @IsOptional()
    @IsUUID()
    restaurantId?: string;

    @IsOptional()
    @IsEnum(staff_type_enum)
    staffType?: staff_type_enum;

   
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive?: boolean;
}