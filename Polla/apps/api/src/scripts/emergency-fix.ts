import { Client } from 'pg';

async function run() {
  const connectionString =
    'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('--- DIAGNOSTICO DE EMERGENCIA ---');
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leagues' 
      AND column_name = 'brand_color_heading'
    `);

    if (res.rows.length > 0) {
      console.log('✅ LA COLUMNA EXISTE EN LA DB:', res.rows[0]);
    } else {
      console.log('❌ LA COLUMNA NO EXISTE EN LA DB. Procediendo a crearla...');
      await client.query(
        "ALTER TABLE leagues ADD COLUMN brand_color_heading VARCHAR(255) DEFAULT '#FFFFFF'",
      );
      await client.query(
        "ALTER TABLE leagues ADD COLUMN brand_color_bars VARCHAR(255) DEFAULT '#00E676'",
      );
      console.log('✅ COLUMNAS CREADAS.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
