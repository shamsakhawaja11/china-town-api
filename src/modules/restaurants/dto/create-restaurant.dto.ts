import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { Trim } from '../../../common/transformers/trim.transformer';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export class CreateRestaurantDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    @Transform(Trim)
    name: string;

    @IsString()
    @IsOptional()
    @Transform(Trim)
    description?: string;

    @IsString()
    @IsNotEmpty()
    @Transform(Trim)
    address: string;

    @IsNumber({ maxDecimalPlaces: 6 })
    @Min(-90)
    @Max(90)
    @IsOptional()
    latitude?: number;

    @IsNumber({ maxDecimalPlaces: 6 })
    @Min(-180)
    @Max(180)
    @IsOptional()
    longitude?: number;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number' })
    @Transform(Trim)
    phone?: string;

    @IsString()
    @Matches(TIME_REGEX, { message: 'opening_time must be in HH:mm format (24-hour)' })
    @Transform(Trim)
    opening_time: string;

    @IsString()
    @Matches(TIME_REGEX, { message: 'closing_time must be in HH:mm format (24-hour)' })
    @Transform(Trim)
    closing_time: string;
}