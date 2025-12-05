import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) { }

  @Get()
  getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch()
  updateSettings(@Body() updateSystemSettingDto: UpdateSystemSettingDto) {
    return this.systemSettingsService.updateSettings(updateSystemSettingDto);
  }
}
