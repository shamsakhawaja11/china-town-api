import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SettingsService {
    constructor(private readonly config: ConfigService) { }

    get taxRate(): number {
        return Number(this.config.get('TAX_RATE_PERCENT') ?? 15) / 100;
    }

    get timeZone(): string {
        return this.config.get<string>('RESTAURANT_TIMEZONE') ?? 'Asia/Karachi';
    }

    get reservationDeposit(): number {
        return Number(this.config.get('RESERVATION_DEPOSIT_AMOUNT') ?? 0);
    }

    get enforceOpeningHours(): boolean {
        return String(this.config.get('ENFORCE_OPENING_HOURS') ?? 'true') !== 'false';
    }

    get reservationFreeCancelHours(): number {
        return Number(this.config.get('RESERVATION_FREE_CANCEL_HOURS') ?? 2);
    }
}