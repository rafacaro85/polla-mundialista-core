const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a la BD de CHAMPIONS (US EAST)...');
    
    // Skip 1741570000000-CreateJokerConfig
    const res1 = await client.query(`
      INSERT INTO migrations (timestamp, name)
      VALUES (1741570000000, 'CreateJokerConfig1741570000000')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Migración CreateJokerConfig marcada como ejecutada. Filas afectadas:', res1.rowCount);

    // Skip 1741580000000-AddVerificationCodeExpiry
    const res2 = await client.query(`
      INSERT INTO migrations (timestamp, name)
      VALUES (1741580000000, 'AddVerificationCodeExpiry1741580000000')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Migración AddVerificationCodeExpiry marcada como ejecutada. Filas afectadas:', res2.rowCount);

  } catch (err) {
    console.error('❌ Error ejecutando consultas:', err);
  } finally {
    await client.end();
  }
}

run();
