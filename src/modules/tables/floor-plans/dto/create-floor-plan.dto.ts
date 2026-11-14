import { Transform } from "class-transformer"
import { Trim } from "../../../../common/transformers/trim.transformer"
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from "class-validator"

export class CreateFloorPlanDto {

    @Transform(Trim)
    @MaxLength(100)
    @IsNotEmpty()
    @IsString()
    name!: string

    @IsInt()
    @Min(1)
    @Max(5000)
    canvasWidth!: number

    @IsInt()
    @Min(1)
    @Max(5000)
    canvasHeight!: number
}