import { Injectable } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, MaxLength, Max, MinLength, ValidateIf } from "class-validator";

export class RegisterUserDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    // Validated when sent. Required only if phone is missing.
    @ValidateIf((o) => o.email !== undefined || o.phone === undefined)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsNotEmpty()
    @IsEmail()
    email?: string;

    // Presence only. Format and normalization happen in the service
    // via normalizeContact().
    @ValidateIf((o) => o.phone !== undefined || o.email === undefined)
    @IsString()
    @IsNotEmpty()
    phone?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(128)
    password!: string;
}