import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReplaceMenuItemSpecializationsDto {
    @IsArray()
    @ArrayUnique()
    @IsUUID('4', { each: true })
    specializationIds!: string[];
}