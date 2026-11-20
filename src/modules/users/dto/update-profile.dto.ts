import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/transformers/trim.transformer';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Transform(Trim)
    name?: string;

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail()
    email?: string;

    /** Pakistani mobile, any common format (0300..., +92300...). */
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    phone?: string;
}
