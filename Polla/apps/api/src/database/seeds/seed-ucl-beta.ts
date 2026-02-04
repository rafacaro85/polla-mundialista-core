import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { User } from '../entities/user.entity';
import { AccessCode } from '../entities/access-code.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
import { Notification } from '../entities/notification.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = process.env.DATABASE_URL
    ? new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
    })
    : new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
        synchronize: false,
    });

// Champions League Teams (Round of 16 - 2025/26 Projection based on top teams)
// Using real flag codes/images where possible or generic placeholders.
const TEAMS: Record<string, string> = {
    'Manchester City': 'gb-eng',
    'Real Madrid': 'es',
    'Bayern Munich': 'de',
    'Liverpool': 'gb-eng',
    'Inter Milan': 'it',
    'Arsenal': 'gb-eng',
    'Barcelona': 'es',
    'PSG': 'fr',
    'Atletico Madrid': 'es',
    'Borussia Dortmund': 'de',
    'Bayer Leverkusen': 'de',
    'Juventus': 'it',
    'AC Milan': 'it',
    'Benfica': 'pt',
    'Aston Villa': 'gb-eng',
    'PSV': 'nl'
};

function getLogo(team: string): string {
    const code = TEAMS[team];
    // Using flagcdn for country flags as placeholders, ideally we would use club logos
    return code ? `https://flagcdn.com/w40/${code}.png` : '';
}

// Round of 16 Matches (Ida and Vuelta)
// Artificial Schedule: Feb/Mar 2026
const MATCHES = [
    // IDA (Feb 17-18, 24-25 2026)
    { date: '2026-02-17T20:00:00Z', home: 'PSV', away: 'Arsenal', group: 'R16', stadium: 'Philips Stadion' },
    { date: '2026-02-17T20:00:00Z', home: 'Benfica', away: 'Real Madrid', group: 'R16', stadium: 'Estádio da Luz' },
    { date: '2026-02-18T20:00:00Z', home: 'Juventus', away: 'Manchester City', group: 'R16', stadium: 'Allianz Stadium' },
    { date: '2026-02-18T20:00:00Z', home: 'AC Milan', away: 'Liverpool', group: 'R16', stadium: 'San Siro' },
    { date: '2026-02-24T20:00:00Z', home: 'Atletico Madrid', away: 'Bayern Munich', group: 'R16', stadium: 'Metropolitano' },
    { date: '2026-02-24T20:00:00Z', home: 'Bayer Leverkusen', away: 'Inter Milan', group: 'R16', stadium: 'BayArena' },
    { date: '2026-02-25T20:00:00Z', home: 'Aston Villa', away: 'Barcelona', group: 'R16', stadium: 'Villa Park' },
    { date: '2026-02-25T20:00:00Z', home: 'Borussia Dortmund', away: 'PSG', group: 'R16', stadium: 'Signal Iduna Park' },

    // VUELTA (Mar 10-11, 17-18 2026)
    { date: '2026-03-10T20:00:00Z', home: 'Arsenal', away: 'PSV', group: 'R16', stadium: 'Emirates Stadium' },
    { date: '2026-03-10T20:00:00Z', home: 'Real Madrid', away: 'Benfica', group: 'R16', stadium: 'Santiago Bernabéu' },
    { date: '2026-03-11T20:00:00Z', home: 'Manchester City', away: 'Juventus', group: 'R16', stadium: 'Etihad Stadium' },
    { date: '2026-03-11T20:00:00Z', home: 'Liverpool', away: 'AC Milan', group: 'R16', stadium: 'Anfield' },
    { date: '2026-03-17T20:00:00Z', home: 'Bayern Munich', away: 'Atletico Madrid', group: 'R16', stadium: 'Allianz Arena' },
    { date: '2026-03-17T20:00:00Z', home: 'Inter Milan', away: 'Bayer Leverkusen', group: 'R16', stadium: 'San Siro' },
    { date: '2026-03-18T20:00:00Z', home: 'Barcelona', away: 'Aston Villa', group: 'R16', stadium: 'Camp Nou' },
    { date: '2026-03-18T20:00:00Z', home: 'PSG', away: 'Borussia Dortmund', group: 'R16', stadium: 'Parc des Princes' }
];

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida (BETA - UCL)');

        const matchRepository = AppDataSource.getRepository(Match);

        // Check if tables exist by attempting a count
        let count = 0;
        try {
            count = await matchRepository.count();
        } catch (error: any) {
            // Error code 42P01 = relation does not exist (table missing)
            if (error.code === '42P01') {
                console.log('⚠️  Tablas no encontradas. Sincronizando esquema...');
                await AppDataSource.destroy();
                
                // Reinitialize with synchronize: true to create tables
                const SyncDataSource = process.env.DATABASE_URL
                    ? new DataSource({
                        type: 'postgres',
                        url: process.env.DATABASE_URL,
                        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
                        synchronize: true, // Force schema creation
                        ssl: { rejectUnauthorized: false },
                    })
                    : new DataSource({
                        type: 'postgres',
                        host: process.env.DB_HOST || 'localhost',
                        port: parseInt(process.env.DB_PORT || '5432', 10),
                        username: process.env.DB_USERNAME || 'postgres',
                        password: process.env.DB_PASSWORD || 'postgres',
                        database: process.env.DB_DATABASE || 'polla_mundialista',
                        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
                        synchronize: true,
                    });
                
                await SyncDataSource.initialize();
                console.log('✅ Esquema sincronizado. Tablas creadas.');
                await SyncDataSource.destroy();
                
                // Reconnect with normal settings
                await AppDataSource.initialize();
                count = 0; // Fresh DB
            } else {
                throw error; // Re-throw if it's a different error
            }
        }

        if (count > 0) {
            console.log(`⚠️  Base de datos no vacía (${count} partidos). Ejecutar reset si se desea limpiar.`);
        }

        console.log('🌍 Iniciando carga de Champions League 25/26 (BETA)...');

        let insertedCount = 0;

        for (const matchData of MATCHES) {
             const match = matchRepository.create({
                homeTeam: matchData.home,
                awayTeam: matchData.away,
                homeFlag: getLogo(matchData.home),
                awayFlag: getLogo(matchData.away),
                date: new Date(matchData.date),
                group: matchData.group, // Using 'R16' as group identifier or Phase
                phase: 'ROUND_OF_16',
                stadium: matchData.stadium,
                homeScore: null,
                awayScore: null,
                status: 'SCHEDULED', // Explicitly SCHEDULED as requested
                isManuallyLocked: false,
            });

            await matchRepository.save(match);
            insertedCount++;
            console.log(`✅ ${matchData.home} vs ${matchData.away}`);
        }

        console.log(`\n🎉 Carga de UCL Beta completada: ${insertedCount} partidos.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en el seed UCL:', error);
        process.exit(1);
    }
}

seed();
