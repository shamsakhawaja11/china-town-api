import { Transform } from "class-transformer"
import { IsNotEmpty, IsOptional, IsString } from "class-validator"

export class LoginUserDto{
    @IsNotEmpty()
    @Transform(({value})=>value.trim().toLowerCase())
    contact:string
    @IsNotEmpty()
    password!:string
    deviceInfo:string
}