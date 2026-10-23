import { PartialType } from "@nestjs/mapped-types";
import { CreateTableCategoryDto } from "./create-table-category.dto";
import { IsBoolean, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { ToBoolean } from "../../../../common/transformers/to-transformer.boolean";

export class UpdateTableCategoryDto extends PartialType(CreateTableCategoryDto){
    @IsOptional()
    @Transform(ToBoolean)
    @IsBoolean()
    isActive?: boolean
}