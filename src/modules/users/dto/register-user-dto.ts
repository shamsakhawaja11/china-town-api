import { Injectable } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, ValidateIf } from "class-validator";

export class RegisterUserDto {
    @IsNotEmpty()
    @IsString()
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
    password!: string
}