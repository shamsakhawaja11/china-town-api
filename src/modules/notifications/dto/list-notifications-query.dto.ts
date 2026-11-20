import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ToBoolean } from '../../../common/transformers/to-transformer.boolean';

export class ListNotificationsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @Transform(ToBoolean)
    @IsBoolean()
    unreadOnly?: boolean;
}
