import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
export declare class SystemSettingsController {
    private readonly systemSettingsService;
    constructor(systemSettingsService: SystemSettingsService);
    getSettings(): Promise<import("./entities/system-setting.entity").SystemSettings>;
    updateSettings(updateSystemSettingDto: UpdateSystemSettingDto): Promise<import("./entities/system-setting.entity").SystemSettings>;
}
