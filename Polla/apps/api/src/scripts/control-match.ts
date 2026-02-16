import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
    });

const HELP_TEXT = `
🎮 MATCH CONTROLLER (Automated Timer)
=====================================

Este script mantiene el tiempo del partido actualizado automáticamente minuto a minuto.
Mantenlo corriendo durante el partido.

Uso:
  npx ts-node apps/api/src/scripts/control-match.ts <MATCH_ID> action [args...]

Comandos Rápidos (Actualizan BD una vez):
  score <H> <A>     -> Actualizar marcador (ej: score 2 1)
  ht                -> Medio Tiempo (Pausa reloj, pone HT)
  ft                -> Final Partido (FINISHED)
  set-time <MM>     -> Ajustar minuto manualmente

MODO LIVE (El reloj corre solo):
  live [start_min]  -> Inicia/Retoma el partido y el reloj avanza cada minuto.
                       Si pones 'live 1', arranca en min 1.
                       Si pones 'live 45', arranca en min 45 (2do tiempo).

Ejemplo Flujo:
  1. Inicio:        ... live 1
  2. Gol:           (En otra terminal) ... score 1 0
  3. Entretiempo:   (Ctrl+C para parar reloj) -> ... ht
  4. 2do Tiempo:    ... live 45
  5. Final:         (Ctrl+C) -> ... ft
`;

async function controlMatch() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const matchId = args[0];
  const action = args[1].toLowerCase();

  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a BD\n');

    // Get match ID info
    let finalId = matchId;
    // Check if numeric (externalId) or uuid
    if (!isNaN(Number(matchId))) {
        const res = await AppDataSource.query(`SELECT id, "homeTeam", "awayTeam" FROM matches WHERE "externalId" = $1`, [matchId]);
        if (res.length > 0) finalId = res[0].id;
        else {
             // Try ID directly just in case
             const resId = await AppDataSource.query(`SELECT id FROM matches WHERE id = $1`, [matchId]);
             if (resId.length === 0) throw new Error("Match not found");
        }
    }

    if (action === 'live') {
        let currentMinute = args[2] ? parseInt(args[2]) : 1;
        console.log(`🔴 MODO LIVE ACTIVO para partido ID: ${finalId}`);
        console.log(`⏱️  Iniciando reloj en minuto: ${currentMinute}'`);
        console.log(`📝 (Presiona Ctrl+C para detener el reloj en el entretiempo o final)\n`);

        // Set initial state
        await AppDataSource.query(`UPDATE matches SET status = 'LIVE', minute = $1 WHERE id = $2`, [currentMinute.toString(), finalId]);
        console.log(`[${new Date().toLocaleTimeString()}] Actualizado a ${currentMinute}'`);

        // Loop every 60 seconds
        setInterval(async () => {
            currentMinute++;
            await AppDataSource.query(`UPDATE matches SET minute = $1 WHERE id = $2`, [currentMinute.toString(), finalId]);
            console.log(`[${new Date().toLocaleTimeString()}] ⏱️  Minuto ${currentMinute}'`);
        }, 60 * 1000); // 60 segundos

        // Keep process alive
        return; 
    }

    let updateQuery = '';
    let params: any[] = [];

    switch (action) {
      case 'start': // Legacy single update
      case 'set-time':
        const min = args[2] || '1';
        console.log(`⏱️  Ajustando minuto a ${min}'...`);
        updateQuery = `UPDATE matches SET status = 'LIVE', minute = $1 WHERE id = $2`;
        params = [min, finalId];
        break;

      case 'score':
        const home = args[2];
        const away = args[3];
        if (home === undefined || away === undefined) throw new Error('Falta marcador (H A)');
        console.log(`🥅  GOL! Marcador actualizado a ${home}-${away}`);
        updateQuery = `UPDATE matches SET "homeScore" = $1, "awayScore" = $2 WHERE id = $3`;
        params = [home, away, finalId];
        break;
      
      case 'ht':
        console.log('⏸️  Medio Tiempo (HT)...');
        updateQuery = `UPDATE matches SET minute = 'HT' WHERE id = $1`;
        params = [finalId];
        break;

      case 'ft':
        console.log('🏁  Final del Partido...');
        updateQuery = `UPDATE matches SET status = 'FINISHED', minute = 'FT' WHERE id = $1`;
        params = [finalId];
        break;

      case 'reset':
        updateQuery = `UPDATE matches SET status = 'SCHEDULED', minute = null, "homeScore" = null, "awayScore" = null WHERE id = $1`;
        params = [finalId];
        break;

      default:
        console.log(`Comando desconocido: ${action}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }

    if (updateQuery) {
        await AppDataSource.query(updateQuery, params);
        console.log('✅ Actualización enviada.');
    }
    
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

controlMatch();
