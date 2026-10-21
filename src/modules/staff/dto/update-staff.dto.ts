import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import { staff_type_enum } from "../../../generated/prisma/enums";
import { Transform } from "class-transformer";
import { Trim } from "../../../common/transformers/trim.transformer";

export class UpdateStaffDto {
    
    @ValidateIf((_, value) => value !== undefined)
    @IsEnum(staff_type_enum)
    staffType?: staff_type_enum;

    @ValidateIf((_, value) => value !== undefined)
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @Transform(Trim)
    position?: string | null;
}