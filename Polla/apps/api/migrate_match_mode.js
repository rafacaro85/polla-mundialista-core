const { Client } = require('pg');
require('dotenv').config();

const urls = [
  process.env.DATABASE_URL,
  'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
  'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  'postgresql://postgres:lAbqgwhmSALnYLFxmHHTEOyuzMqqzsRS@ballast.proxy.rlwy.net:50167/railway'
];

async function run() {
  let client = null;
  let connected = false;

  for (const url of urls) {
    if (!url) continue;
    try {
      client = new Client({
        connectionString: url,
        ssl: url.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      await client.connect();
      console.log('✅ Conectado a la base de datos de producción usando proxy:', url.includes('@') ? url.split('@')[1] : 'local');
      connected = true;
      break;
    } catch (err) {
      console.log('⚠️ Falló conexión con URL:', url.includes('@') ? url.split('@')[1] : url, '->', err.message);
    }
  }

  if (!connected) {
    console.error('❌ No se pudo conectar a ninguna base de datos.');
    return;
  }

  try {
    console.log('🔄 Ejecutando migraciones de schema en la tabla leagues...');
    
    // 1. Eliminar la columna matchEventType si existe
    await client.query(`ALTER TABLE leagues DROP COLUMN IF EXISTS "matchEventType";`);
    console.log('  (-) Columna matchEventType eliminada (o no existía).');

    // 2. Agregar la nueva columna showTableNumbers
    await client.query(`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS "showTableNumbers" BOOLEAN DEFAULT true;`);
    console.log('  (+) Columna showTableNumbers añadida existosamente.');

    console.log('🎉 Migración de Match Mode Finalizada!');

  } catch (err) {
    console.error('❌ Error durante la migración:', err);
  } finally {
    if (client) await client.end();
  }
}

run();
