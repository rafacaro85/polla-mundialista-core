
import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { config } from 'dotenv';
import * as path from 'path';

// Force load .env from api folder
config({ path: path.join(__dirname, '../../.env') });

const DB_Config = {
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/polla_mundialista',
    entities: [__dirname + '/../database/entities/*.entity.ts'],
    synchronize: true, // AUTO-SYNC SCHEMA
    ssl: { rejectUnauthorized: false },
};

async function seedUCL() {
    console.log('🚀 Starting Manual UCL Seed...');
    console.log('DB URL:', DB_Config.url);

    const ds = new DataSource(DB_Config as any);
    await ds.initialize();
    console.log('✅ Connected to DB');

    const matchRepo = ds.getRepository(Match);
    const phaseRepo = ds.getRepository(KnockoutPhaseStatus);

    try {
        // CLEANUP: Delete previous beta/test matches for this tournament
        console.log('🧹 Clearing old UCL2526 matches...');
        await matchRepo.delete({ tournamentId: 'UCL2526' });
        
        // MATCHES DATA
        const MATCHES_DATA = [
            // PLAY-OFFS IDA (Feb 17, 2026)
            { date: '2026-02-17T12:45:00Z', home: 'Galatasaray', away: 'Juventus', group: 'PO', stadium: 'RAMS Park' },
            { date: '2026-02-17T15:00:00Z', home: 'Monaco', away: 'PSG', group: 'PO', stadium: 'Stade Louis II' },
            { date: '2026-02-17T15:00:00Z', home: 'Benfica', away: 'Real Madrid', group: 'PO', stadium: 'Estádio da Luz' },
            { date: '2026-02-17T15:00:00Z', home: 'Borussia Dortmund', away: 'Atalanta', group: 'PO', stadium: 'Signal Iduna Park' },

            // PLAY-OFFS IDA (Feb 18, 2026)
            { date: '2026-02-18T12:45:00Z', home: 'Qarabağ', away: 'Newcastle', group: 'PO', stadium: 'Tofiq Bahramov Stadium' },
            { date: '2026-02-18T15:00:00Z', home: 'Olympiacos', away: 'Bayer Leverkusen', group: 'PO', stadium: 'Karaiskakis Stadium' },
            { date: '2026-02-18T15:00:00Z', home: 'Bodø/Glimt', away: 'Inter Milan', group: 'PO', stadium: 'Aspmyra Stadion' },
            { date: '2026-02-18T15:00:00Z', home: 'Club Brugge', away: 'Atletico Madrid', group: 'PO', stadium: 'Jan Breydel Stadium' },

            // PLAY-OFFS VUELTA (Feb 24, 2026)
            { date: '2026-02-24T12:45:00Z', home: 'Atletico Madrid', away: 'Club Brugge', group: 'PO', stadium: 'Metropolitano' },
            { date: '2026-02-24T15:00:00Z', home: 'Newcastle', away: 'Qarabağ', group: 'PO', stadium: 'St James Park' },
            { date: '2026-02-24T15:00:00Z', home: 'Bayer Leverkusen', away: 'Olympiacos', group: 'PO', stadium: 'BayArena' },
            { date: '2026-02-24T15:00:00Z', home: 'Inter Milan', away: 'Bodø/Glimt', group: 'PO', stadium: 'San Siro' },

            // PLAY-OFFS VUELTA (Feb 25, 2026)
            { date: '2026-02-25T12:45:00Z', home: 'Atalanta', away: 'Borussia Dortmund', group: 'PO', stadium: 'Gewiss Stadium' },
            { date: '2026-02-25T15:00:00Z', home: 'Real Madrid', away: 'Benfica', group: 'PO', stadium: 'Santiago Bernabéu' },
            { date: '2026-02-25T15:00:00Z', home: 'PSG', away: 'Monaco', group: 'PO', stadium: 'Parc des Princes' },
            { date: '2026-02-25T15:00:00Z', home: 'Juventus', away: 'Galatasaray', group: 'PO', stadium: 'Allianz Stadium' },
        ];

        let count = 0;
        for (const mData of MATCHES_DATA) {
            const exists = await matchRepo.findOne({ 
                where: { 
                    homeTeam: mData.home, 
                    awayTeam: mData.away, 
                    phase: 'PLAYOFF',
                    tournamentId: 'UCL2526' 
                } 
            });

            if (!exists) {
                await matchRepo.save({
                    tournamentId: 'UCL2526',
                    phase: 'PLAYOFF',
                    homeTeam: mData.home,
                    awayTeam: mData.away,
                    date: new Date(mData.date),
                    group: mData.group,
                    stadium: mData.stadium,
                    status: 'SCHEDULED',
                    homeScore: null,
                    awayScore: null
                });
                count++;
            }
        }
        console.log(`✅ Seeded ${count} UCL matches.`);

        // UNLOCK PHASE
        const phaseExists = await phaseRepo.findOne({ where: { phase: 'PLAYOFF', tournamentId: 'UCL2526' } });
        if (!phaseExists) {
            await phaseRepo.save({
                tournamentId: 'UCL2526',
                phase: 'PLAYOFF',
                isUnlocked: true,
                allMatchesCompleted: false
            });
            console.log('✅ Unlocked PLAYOFF phase.');
        } else {
             console.log('ℹ️ PLAYOFF Phase already exists.');
        }

    } catch (err) {
        console.error('❌ Error Seeding:', err);
    } finally {
        await ds.destroy();
    }
}

seedUCL();
