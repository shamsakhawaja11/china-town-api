import { IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class TopUpWalletDto {
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(100)
    @Max(50000)
    amount!: number;

    /** Only the last 4 digits, never the full card number. */
    @IsOptional()
    @Matches(/^\d{4}$/, { message: 'cardLast4 must be exactly 4 digits' })
    cardLast4?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    idempotencyKey?: string;
}
