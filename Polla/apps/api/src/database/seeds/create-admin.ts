import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

async function main() {
  console.log('🚀 Creando usuario administrador local...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_DATABASE || 'polla_mundialista',
    entities: [],
    ssl: false,
  });

  try {
    await dataSource.initialize();

    const email = 'admin@admin.com';
    const password = 'admin123';
    const fullName = 'Admin Local';
    const role = 'ADMIN';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const existing = await dataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existing.length > 0) {
      console.log(
        '⚠️ El usuario admin@admin.com ya existe. Actualizando contraseña y rol...',
      );
      await dataSource.query(
        'UPDATE users SET password = $1, role = $2, is_verified = true, full_name = $3 WHERE email = $4',
        [hashedPassword, role, fullName, email],
      );
    } else {
      console.log('📝 Creando nuevo usuario admin@admin.com...');
      await dataSource.query(
        `INSERT INTO users (id, email, password, full_name, role, is_verified, created_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW())`,
        [email, hashedPassword, fullName, role],
      );
    }

    console.log('✅ Usuario Admin creado/actualizado con éxito!');
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Pass: admin123');
  } catch (err) {
    console.error('❌ Error creando admin:', err);
  } finally {
    await dataSource.destroy();
  }
}

main();
