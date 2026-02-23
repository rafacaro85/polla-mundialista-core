import { DataSource } from 'typeorm';
import { SystemSettings } from '../system-settings/entities/system-setting.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_DATABASE || 'polla_mundialista',
    entities: [SystemSettings],
    ssl: false,
  });

  await dataSource.initialize();
  const repository = dataSource.getRepository(SystemSettings);

  let settings = await repository.findOne({ where: { id: 1 } });
  if (!settings) {
    settings = repository.create({ id: 1 });
  }

  settings.termsUrl = '/terminos';
  settings.privacyUrl = '/privacidad';

  await repository.save(settings);
  console.log('✅ System Settings updated with /terminos and /privacidad');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error seeding system settings:', err);
  process.exit(1);
});
