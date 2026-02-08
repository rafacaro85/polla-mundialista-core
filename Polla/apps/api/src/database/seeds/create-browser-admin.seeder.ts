import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_DATABASE || 'polla_mundialista',
  entities: ['src/database/entities/*.entity.ts'],
  synchronize: false,
});

async function createBrowserAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connection established');

    const repo = AppDataSource.getRepository(User);
    const email = 'browser-admin@test.com';
    const passwordRaw = 'password123';

    // Hash password (rounds=10 is standard)
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    let user = await repo.findOne({ where: { email } });

    if (user) {
      user.password = hashedPassword;
      user.role = UserRole.SUPER_ADMIN;
      user.isVerified = true;
      await repo.save(user);
      console.log('✅ Updated existing browser-admin user.');
    } else {
      user = repo.create({
        email,
        password: hashedPassword,
        fullName: 'Browser Admin',
        nickname: 'Bot',
        role: UserRole.SUPER_ADMIN,
        isVerified: true,
      });
      await repo.save(user);
      console.log('✅ Created new browser-admin user.');
    }

    console.log(`Credentials: ${email} / ${passwordRaw}`);
  } catch (e) {
    console.error(e);
  } finally {
    await AppDataSource.destroy();
  }
}
createBrowserAdmin();
