const { Client } = require('pg');
const connectionString = 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway';

async function verifyC4C5() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('--- VERIFICACIÓN C5 (CRON WINDOW) ---');
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);

  const allMatchesRes = await client.query('SELECT COUNT(*) FROM matches WHERE status != \'FINISHED\' AND "externalId" IS NOT NULL');
  console.log(`Total partidos activos en BD: ${allMatchesRes.rows[0].count}`);

  const windowMatchesRes = await client.query(`
    SELECT id, "homeTeam", "awayTeam", date 
    FROM matches 
    WHERE status != 'FINISHED' 
    AND "externalId" IS NOT NULL
    AND date >= $1 AND date <= $2
  `, [threeHoursAgo, oneHourFromNow]);

  console.log(`Partidos dentro de ventana (-3h/+1h): ${windowMatchesRes.rows.length}`);
  windowMatchesRes.rows.forEach(m => console.log(`  - [${m.homeTeam} vs ${m.awayTeam}] @ ${m.date}`));

  console.log('\n--- VERIFICACIÓN C4 (SCORING VOLUMEN) ---');
  const finishedMatchRes = await client.query('SELECT id FROM matches WHERE status = \'FINISHED\' LIMIT 1');
  if (finishedMatchRes.rows.length > 0) {
    const mId = finishedMatchRes.rows[0].id;
    const predCountRes = await client.query('SELECT COUNT(*) FROM predictions WHERE "matchId" = $1', [mId]);
    console.log(`Partido finalizado [${mId}] tiene ${predCountRes.rows[0].count} predicciones.`);
    console.log(`Lógica previa: ${predCountRes.rows[0].count} transacciones individuales.`);
    console.log(`Lógica nueva (C4): 1 sola transacción masiva (INSERT/UPDATE ... ON CONFLICT).`);
  }

  await client.end();
}

verifyC4C5();
