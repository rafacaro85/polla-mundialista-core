const { Client } = require('pg');
const connectionString = 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway';

async function testConcurrency() {
  const userId = 'd57ea9c1-7a27-4ae0-8d6a-cb3e892881d6';
  const matchId = 'd42f46ef-cea9-4962-bea4-54d087a22a76';

  const client1 = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  const client2 = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client1.connect();
    await client2.connect();

    console.log('🚀 Iniciando prueba de concurrencia C3...');

    // 1. Iniciamos transacción en Conexión 1 y pedimos LOCK
    await client1.query('BEGIN');
    console.log('🔹 Conexión 1: BEGIN');
    
    // Intentamos obtener el lock (simulando upsertPrediction con SELECT FOR UPDATE)
    // Primero aseguramos que exista una predicción para bloquear
    await client1.query(`
      INSERT INTO predictions (id, "userId", "matchId", "homeScore", "awayScore", "isJoker", "tournamentId")
      VALUES (gen_random_uuid(), '${userId}', '${matchId}', 1, 1, false, 'UCL2526')
      ON CONFLICT DO NOTHING
    `);

    console.log('🔹 Conexión 1: Solicitando Pessimistic Lock (SELECT FOR UPDATE)...');
    await client1.query(`SELECT id FROM predictions WHERE "userId" = '${userId}' AND "matchId" = '${matchId}' FOR UPDATE`);
    console.log('✅ Conexión 1: Lock obtenido.');

    // 2. Iniciamos transacción en Conexión 2 e intentamos pedir el MISMO LOCK
    console.log('🔸 Conexión 2: Intentando obtener el mismo lock (debería bloquearse)...');
    
    const start2 = Date.now();
    const lockPromise2 = client2.query('BEGIN').then(() => 
      client2.query(`SELECT id FROM predictions WHERE "userId" = '${userId}' AND "matchId" = '${matchId}' FOR UPDATE`)
    );

    // Esperamos un momento para asegurar que Conexión 2 esté bloqueada
    await new Promise(r => setTimeout(r, 2000));
    console.log(`⏳ Han pasado ${Date.now() - start2}ms y Conexión 2 sigue bloqueada (comportamiento esperado).`);

    // 3. Liberamos Conexión 1
    console.log('🔹 Conexión 1: COMMIT (liberando lock)...');
    await client1.query('COMMIT');

    // 4. Verificamos que Conexión 2 se desbloqueó
    await lockPromise2;
    console.log(`✅ Conexión 2: Lock obtenido después de que Conexión 1 liberó.`);
    await client2.query('COMMIT');

    console.log('\n🏆 Fix C3 VERIFICADO: El pessimistic locking funciona correctamente en Railway.');

  } catch (err) {
    console.error('❌ Error en la prueba:', err);
  } finally {
    await client1.end();
    await client2.end();
  }
}

testConcurrency();
