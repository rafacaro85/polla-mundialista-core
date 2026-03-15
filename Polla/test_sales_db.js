const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/polla_mundialista',
});

async function run() {
  await client.connect();
  
  // Total of all transactions (The old bugged way)
  const resBugged = await client.query(`SELECT "tournamentId", SUM(amount) FROM transactions GROUP BY "tournamentId"`);
  
  // Total of only PAID/APPROVED transactions (The fixed way)
  const resFixed = await client.query(`SELECT "tournamentId", SUM(amount) FROM transactions WHERE status IN ('PAID', 'APPROVED') GROUP BY "tournamentId"`);
  
  console.log("---- METRICAS REALES EN BASE DE DATOS ----");
  console.log("🔥 ANTES DEL FIX (Sumando TODO, incluyendo PENDING/REJECTED):");
  resBugged.rows.forEach(r => {
     console.log(`  - Torneo: ${r.tournamentId} | Monto: ${Number(r.sum).toLocaleString('es-CO')}`);
  });
  
  console.log("\n✅ DESPUES DEL FIX (Solo contando APPROVED y PAID):");
  resFixed.rows.forEach(r => {
     console.log(`  - Torneo: ${r.tournamentId} | Monto: ${Number(r.sum).toLocaleString('es-CO')}`);
  });
  
  await client.end();
}

run().catch(console.dir);
