import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { Trim } from '../../../common/transformers/trim.transformer';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export class UpdateRestaurantDto {

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    @Transform(Trim)
    name?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @IsNotEmpty()
    @Transform(Trim)
    address?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @Matches(TIME_REGEX, { message: 'opening_time must be in HH:mm format (24-hour)' })
    @Transform(Trim)
    opening_time?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @Matches(TIME_REGEX, { message: 'closing_time must be in HH:mm format (24-hour)' })
    @Transform(Trim)
    closing_time?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsString()
    @Transform(Trim)
    description?: string | null;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 6 })
    @Min(-90)
    @Max(90)
    latitude?: number | null;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 6 })
    @Min(-180)
    @Max(180)
    longitude?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number' })
    @Transform(Trim)
    phone?: string | null;
}