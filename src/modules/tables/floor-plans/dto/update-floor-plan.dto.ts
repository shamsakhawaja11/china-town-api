import { PartialType } from "@nestjs/mapped-types";
import { CreateFloorPlanDto } from "./create-floor-plan.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateFloorPlanDto extends PartialType(CreateFloorPlanDto) {   

    @IsBoolean()
    @IsOptional()
    isActive?: boolean
}