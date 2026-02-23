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
    console.log('--- Comprobación de Realidad ---');

    // Verificar todas las columnas de leagues
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leagues' 
      ORDER BY column_name;
    `);

    console.log(`Columnas encontradas (${res.rows.length}):`);
    console.log(res.rows.map((r) => r.column_name).join(', '));

    const hasHeading = res.rows.some(
      (r) => r.column_name === 'brand_color_heading',
    );
    console.log('¿Tiene brand_color_heading?:', hasHeading);

    if (!hasHeading) {
      console.log(
        'ERROR CRÍTICO: Mi diagnóstico anterior decía que sí, pero ahora dice que no.',
      );
      console.log('Intentando añadir de nuevo con SQL puro...');
      await client.query(
        'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS brand_color_heading VARCHAR(255);',
      );
      await client.query(
        'ALTER TABLE leagues ADD COLUMN IF NOT EXISTS brand_color_bars VARCHAR(255);',
      );
      console.log('Comandos ejecutados.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
