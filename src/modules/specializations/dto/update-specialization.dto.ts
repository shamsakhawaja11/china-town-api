import { Injectable } from "@nestjs/common";
import { PartialType } from "@nestjs/mapped-types";
import { CreateSpecializationDto } from "./create-specialization.dto";

@Injectable()
export class UpdateSpecializationDto extends PartialType(CreateSpecializationDto) { }