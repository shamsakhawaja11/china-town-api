import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class CheckAvailabilityQueryDto {
    @IsISO8601()
    reservationTime!: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    partySize!: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(30)
    @Max(500)
    durationMinutes: number = 90;
}
