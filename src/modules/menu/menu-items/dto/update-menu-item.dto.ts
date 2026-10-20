import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateMenuItemDto } from "./create-menu-item.dto";

export class UpdateMenuItemDto extends PartialType(
    OmitType(CreateMenuItemDto, ['ingredients', 'specializationIds']),
) { }