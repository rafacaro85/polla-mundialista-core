import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-setting.entity';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSettings)
    private settingsRepository: Repository<SystemSettings>,
  ) {}

  async getSettings(): Promise<SystemSettings> {
    let settings = await this.settingsRepository.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingsRepository.create({ id: 1 });
      await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async updateSettings(
    updateDto: UpdateSystemSettingDto,
  ): Promise<SystemSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, updateDto);
    return this.settingsRepository.save(settings);
  }
}
