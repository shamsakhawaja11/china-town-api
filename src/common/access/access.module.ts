import { Global, Module } from '@nestjs/common';
import { StaffAccessService } from './staff-access.service';
import { SettingsService } from './settings.service';

@Global()
@Module({
    providers: [StaffAccessService, SettingsService],
    exports: [StaffAccessService, SettingsService],
})
export class AccessModule { }
