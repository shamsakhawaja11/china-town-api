import { Injectable } from "@nestjs/common";
import { PartialType } from "@nestjs/mapped-types";
import { CreateSpecializationDto } from "./create-specialization.dto";
import { IsOptional, IsString, Max } from "class-validator";

@Injectable()
export class UpdateSpecializationDto {
    @IsString()
    @IsOptional()
    @Max(100)
    name?: string
    @IsOptional()
    @IsString()
    decription?:string
    @IsOptional()
    is_active?:true

 }