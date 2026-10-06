import { Injectable } from "@nestjs/common";
import { IsNotEmpty, IsOptional, IsString, Max } from "class-validator";

@Injectable()
export class CreateSpecializationDto {
    @IsString()
    @Max(100)
    @IsNotEmpty()
    name!: string
    @IsOptional()
    @IsString()
    description?: string
}