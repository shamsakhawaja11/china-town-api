import { Injectable } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, ValidateIf } from "class-validator";

@Injectable()
export class RegisterUserDto {
    @IsNotEmpty()
    @IsString()
    name!: string
    @IsEmail()
    @IsNotEmpty()
    @ValidateIf(o => o.email !== undefined || !o.phone)
    @Transform()
    email?: string
    @IsPhoneNumber()
    @IsNotEmpty()
    @ValidateIf(o => o.phone !== undefined || o.email)
    phone?: number
    @IsString()
    @IsNotEmpty()
    hashPassword: string
}