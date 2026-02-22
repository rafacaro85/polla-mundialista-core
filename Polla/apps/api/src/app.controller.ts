import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug/db-schema')
  async debugDbSchema() {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const table = await queryRunner.getTable('leagues');
      const columns = table?.columns.map(c => ({ name: c.name, type: c.type }));
      
      // Masking sensitive info but showing the host/db
      const config = this.dataSource.options as any;
      const maskedUrl = config.url ? config.url.replace(/:[^:@]+@/, ':***@') : 'N/A';
      
      return {
        database: config.database || 'N/A',
        host: config.host || 'N/A',
        url: maskedUrl,
        tableName: table?.name,
        columnsCount: columns?.length,
        brandColorHeadingExists: columns?.some(c => c.name === 'brand_color_heading'),
        columns: columns
      };
    } catch (e) {
      return { error: e.message };
    } finally {
      await queryRunner.release();
    }
  }
}
