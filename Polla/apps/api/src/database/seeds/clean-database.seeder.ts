import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [],
  synchronize: false,
});

async function cleanDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida\n');

    console.log('🗑️  Eliminando predicciones...');
    await AppDataSource.query('DELETE FROM predictions');
    console.log('✅ Predicciones eliminadas');

    console.log('🗑️  Eliminando participantes de ligas...');
    await AppDataSource.query('DELETE FROM league_participants');
    console.log('✅ Participantes eliminados');

    console.log('🗑️  Eliminando ligas...');
    await AppDataSource.query('DELETE FROM leagues');
    console.log('✅ Ligas eliminadas');

    console.log('🗑️  Eliminando códigos de acceso...');
    await AppDataSource.query('DELETE FROM access_codes');
    console.log('✅ Códigos eliminados');

    console.log('🗑️  Eliminando usuarios...');
    await AppDataSource.query('DELETE FROM users');
    console.log('✅ Usuarios eliminados');

    const result = await AppDataSource.query(
      'SELECT COUNT(*) as count FROM users',
    );
    const count = parseInt(result[0].count);

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 Usuarios restantes: ${count}`);
    console.log('═'.repeat(60));

    if (count === 0) {
      console.log('\n🎉 ¡Base de datos limpiada exitosamente!');
      console.log('✅ Puedes continuar con el siguiente paso\n');
    } else {
      console.log('\n⚠️  Advertencia: Aún quedan usuarios en la base de datos');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

cleanDatabase();
