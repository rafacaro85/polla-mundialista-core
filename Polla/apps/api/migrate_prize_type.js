const { Client } = require('pg');

async function run() {
  // Detectar connection string del .env
  require('dotenv').config({ path: '.env' });

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'polla_db',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la BD');

    // Verificar si las columnas ya existen
    const check = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'leagues' AND column_name IN ('prize_type', 'prize_amount')
    `);
    console.log('Columnas existentes:', check.rows.map(r => r.column_name));

    // Añadir prize_type si no existe
    await client.query(`
      ALTER TABLE leagues
      ADD COLUMN IF NOT EXISTS prize_type varchar DEFAULT 'image'
    `);
    console.log('✅ prize_type: OK (IF NOT EXISTS)');

    // Añadir prize_amount si no existe
    await client.query(`
      ALTER TABLE leagues
      ADD COLUMN IF NOT EXISTS prize_amount decimal(15,2) DEFAULT NULL
    `);
    console.log('✅ prize_amount: OK (IF NOT EXISTS)');

    // Verificación final
    const final = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'leagues' AND column_name IN ('prize_type', 'prize_amount')
    `);
    console.log('Estado final de columnas:', final.rows);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
