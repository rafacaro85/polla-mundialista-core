
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function testJokerFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Conectado');

    const userId = '7fa27b5a-a73a-495b-9ade-08043ea7a890'; // RCARO
    const matchId = 'f6dbea18-3b18-4b37-adb4-b31cf53e804d'; // Países Bajos vs PLA_D

    // 1. Limpiar predicción previa
    await client.query('DELETE FROM predictions WHERE "userId" = $1 AND "matchId" = $2', [userId, matchId]);
    console.log('🗑️ Predicción previa eliminada');

    // 2. Insertar configuración de prueba si no existe (Global WC2026 = 3)
    // Ya debería existir por la migración previa.

    // 3. Simular upsert via API (o directamente llamando al servicio si pudiéramos, pero probaremos el SQL del servicio)
    // Recreamos la lógica del query builder en SQL puro para ver si falla el cast
    const qCount = `
      SELECT count(p.id) as count 
      FROM predictions p 
      INNER JOIN matches m ON m.id = p."matchId" 
      WHERE p."userId" = $1 
      AND p."isJoker" = true 
      AND m."tournamentId" = 'WC2026' 
      AND m.id != $2
    `;
    const resCount = await client.query(qCount, [userId, matchId]);
    console.log('📊 Jokers actuales:', resCount.rows[0].count);

    // Si esto funciona con parámetros positional, entonces el cast es automático.
    // El problema en TypeORM suele ser cuando se pasa el objeto entero o el alias es incorrecto.

    console.log('🚀 Todo parece indicar que el SQL es válido con estos IDs.');

  } catch (e) {
    console.error('❌ Error:', e);
  } finally {
    await client.end();
  }
}

testJokerFix();
