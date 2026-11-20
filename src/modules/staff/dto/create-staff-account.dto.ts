import { Transform } from 'class-transformer';
import {
    ArrayUnique, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf,
} from 'class-validator';
import { staff_type_enum } from '../../../generated/prisma/enums';
import { Trim } from '../../../common/transformers/trim.transformer';

export class CreateStaffAccountDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Transform(Trim)
    name!: string;

    @ValidateIf((o) => o.email !== undefined || o.phone === undefined)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail()
    email?: string;

    @ValidateIf((o) => o.phone !== undefined || o.email === undefined)
    @IsString()
    @IsNotEmpty()
    phone?: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;

    /** Defaults to the main branch. */
    @IsOptional()
    @IsUUID()
    restaurantId?: string;

    @IsEnum(staff_type_enum)
    staffType!: staff_type_enum;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @Transform(Trim)
    position?: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsUUID('all', { each: true })
    specializationIds?: string[];
}
