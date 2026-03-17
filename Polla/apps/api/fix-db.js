const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a la BD de CHAMPIONS (US EAST)...');
    
    // Skip 1734912000000-CreateKnockoutPhaseStatus
    const res1 = await client.query(`
      INSERT INTO migrations (timestamp, name)
      VALUES (1734912000000, 'CreateKnockoutPhaseStatus1734912000000')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Migración CreateKnockoutPhaseStatus marcada como ejecutada. Filas afectadas:', res1.rowCount);

  } catch (err) {
    console.error('❌ Error ejecutando consultas:', err);
  } finally {
    await client.end();
  }
}

run();
