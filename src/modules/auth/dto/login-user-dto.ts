import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

export class LoginUserDto{
    @IsNotEmpty()
    @IsString()
    contact!:string
    @IsNotEmpty()
    @MaxLength(50)
    @IsString()
    password!:string
    @IsOptional()
    @IsString()
    @MaxLength(255)
    deviceInfo?:string
}