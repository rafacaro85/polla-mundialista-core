
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkIntegrity() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('--- Inspeccionando Liga y Creador (ID CORRECTO) ---');
    
    const leagueId = '4b5f5caf-4f5c-49e6-9600-409f29081a46';
    const res = await client.query('SELECT id, name, creator_id, status FROM leagues WHERE id = $1', [leagueId]);

    if (res.rows.length > 0) {
      const league = res.rows[0];
      console.log('✅ Liga encontrada:', league);
      
      const creatorRes = await client.query('SELECT id, email, nickname FROM users WHERE id = $1', [league.creator_id]);
      if (creatorRes.rows.length > 0) {
        console.log('✅ Creador encontrado:', creatorRes.rows[0]);
      } else {
        console.log('❌ Creador NO encontrado con ID:', league.creator_id);
      }
    } else {
      console.log('❌ Liga NO encontrada con ID:', leagueId);
      
      const leagueCount = await client.query('SELECT COUNT(*) FROM leagues');
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`Total Ligas en DB: ${leagueCount.rows[0].count}`);
      console.log(`Total Usuarios en DB: ${userCount.rows[0].count}`);

      // Mostrar muestra de ligas existentes
      const sample = await client.query('SELECT id, name FROM leagues LIMIT 10');
      console.log('Muestra de ligas en DB:', sample.rows);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

checkIntegrity();
