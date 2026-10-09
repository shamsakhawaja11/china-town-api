import { Injectable } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, MaxLength, Max, MinLength, ValidateIf } from "class-validator";

export class RegisterUserDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    @MinLength(1)
    name!: string
    @IsEmail()
    @IsNotEmpty()
    @ValidateIf(o => !o.phone)
    @Transform(({ value }) => value.trim().toLowerCase())
    email?: string
    @IsNotEmpty()
    @IsPhoneNumber()
    @ValidateIf(o => !o.email)
    phone?: string
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(50)
    password!: string
}