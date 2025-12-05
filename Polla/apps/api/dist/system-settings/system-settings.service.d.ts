import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-setting.entity';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
export declare class SystemSettingsService {
    private settingsRepository;
    constructor(settingsRepository: Repository<SystemSettings>);
    getSettings(): Promise<SystemSettings>;
    updateSettings(updateDto: UpdateSystemSettingDto): Promise<SystemSettings>;
}
