const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: 'apps/api/.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/polla_mundialista';

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log("🟢 Conectado a la BD");

    // 1. Verificar conteo inicial
    const countRes = await client.query(`SELECT COUNT(*) FROM "matches" WHERE "tournamentId" = 'UCL2526'`);
    console.log(`\n📊 Partidos UCL2526 antes del script: ${countRes.rows[0].count}`);

    // 2. Eliminar fases finales corruptas (Excepto los Playoff si existieran)
    console.log("🧹 Eliminando partidos corruptos (ROUND_16, QUARTER_FINAL, SEMI_FINAL, FINAL)...");
    const delRes = await client.query(`
      DELETE FROM "matches" 
      WHERE "tournamentId" = 'UCL2526' 
      AND "phase" IN ('ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');
    `);
    console.log(`✅ ${delRes.rowCount} partidos eliminados.`);

    // 3. Leer y procesar archivo seed
    console.log("\n🌱 Aplicando seed (seed_ucl2526_knockout.sql)...");
    const sqlFile = fs.readFileSync('seed_ucl2526_knockout.sql', 'utf8');
    await client.query(sqlFile);
    console.log(`✅ Seed ejecutado exitosamente.`);

    // 4. Verificación final requerida por el usuario
    console.log("\n📋 --- VERIFICACIÓN DE OCTAVOS DE FINAL ---");
    const viewRes = await client.query(`
      SELECT "homeTeam", "awayTeam", "date", "phase" 
      FROM "matches" 
      WHERE "tournamentId" = 'UCL2526' 
      AND "phase" = 'ROUND_16'
      ORDER BY "date" ASC;
    `);
    
    console.table(viewRes.rows);

  } catch (err) {
    console.error("❌ ERROR DURANTE LA OPERACIÓN:", err);
  } finally {
    await client.end();
    console.log("🔴 Desconectado");
  }
}

run();
