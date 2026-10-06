import { Injectable } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

@Injectable()
export class CreateSpecializationDto {
    @IsString()
    @MaxLength(100)
    @IsNotEmpty()
    name!: string
    @IsOptional()
    @IsString() 
    description?: string
}