
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
        
        // TEAM LOGOS (Using reliable CDN or placeholders)
        const FLAGS: Record<string, string> = {
            'Benfica': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/SL_Benfica_logo.svg', // Changed to commons/a/a2 if possible, or try another source. valid: https://upload.wikimedia.org/wikipedia/commons/a/a2/SL_Benfica_logo.svg (Redirects?) -> Try https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/SL_Benfica_logo.svg/1200px-SL_Benfica_logo.svg.png just to be safe? No, stick to SVG if possible but from commons.
            // Let's use known working Commons URLs where possible.
            // Removed duplicate 'Benfica': '...' here. 
            'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png', // Fallback to PNG for "en" wiki if SVG fails CORS
            'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
            'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/1200px-Liverpool_FC.svg.png',
            'PSV': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/PSV_Eindhoven.svg/1200px-PSV_Eindhoven.svg.png',
            'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png',
            'Club Brugge': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/Club_Brugge_KV_logo.svg/1200px-Club_Brugge_KV_logo.svg.png', // This worked? No, user said "CLU" (Logo) in Image 2. Wait. Image 2 has CLU logo. It was working.
            'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/1200px-Atletico_Madrid_2017_logo.svg.png',
            'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juventus_FC_2017_icon_%28black%29.svg/1200px-Juventus_FC_2017_icon_%28black%29.svg.png',
            'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
            'Bayer Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg', // Worked
            'Inter Milan': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg', // Worked
            'Sporting CP': 'https://upload.wikimedia.org/wikipedia/en/e/e1/Sporting_Clube_de_Portugal_%28Logo%29.svg',
            'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
            'Feyenoord': 'https://upload.wikimedia.org/wikipedia/en/e/e3/Feyenoord_logo.svg',
            'PSG': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/1200px-Paris_Saint-Germain_F.C..svg.png',
            'Galatasaray': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Galatasaray_Sports_Club_Logo.png/1200px-Galatasaray_Sports_Club_Logo.png',
            'Monaco': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/AS_Monaco_FC_logo.svg/1200px-AS_Monaco_FC_logo.svg.png', // Using PNG thumb for safety
            'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg', // Worked
            'Atalanta': 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg', // Worked? Image 1: ATA logo. Yes.
            'Qarabağ': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Qaraba%C4%9F_FK_logo.png/1200px-Qaraba%C4%9F_FK_logo.png',
            'Newcastle': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg', // Worked
            'Olympiacos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Olympiacos_FC_logo.svg/1200px-Olympiacos_FC_logo.svg.png',
            'Bodø/Glimt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/FK_Bod%C3%B8_Glimt.svg/1200px-FK_Bod%C3%B8_Glimt.svg.png'
        };

        // MATCHES DATA
        const MATCHES_DATA = [
            // PLAY-OFFS IDA (Feb 17, 2026)
            { date: '2026-02-17T12:45:00Z', home: 'Galatasaray', away: 'Juventus', group: 'Play-off Ida', stadium: 'RAMS Park' },
            { date: '2026-02-17T15:00:00Z', home: 'Monaco', away: 'PSG', group: 'Play-off Ida', stadium: 'Stade Louis II' },
            { date: '2026-02-17T15:00:00Z', home: 'Benfica', away: 'Real Madrid', group: 'Play-off Ida', stadium: 'Estádio da Luz' },
            { date: '2026-02-17T15:00:00Z', home: 'Borussia Dortmund', away: 'Atalanta', group: 'Play-off Ida', stadium: 'Signal Iduna Park' },

            // PLAY-OFFS IDA (Feb 18, 2026)
            { date: '2026-02-18T12:45:00Z', home: 'Qarabağ', away: 'Newcastle', group: 'Play-off Ida', stadium: 'Tofiq Bahramov Stadium' },
            { date: '2026-02-18T15:00:00Z', home: 'Olympiacos', away: 'Bayer Leverkusen', group: 'Play-off Ida', stadium: 'Karaiskakis Stadium' },
            { date: '2026-02-18T15:00:00Z', home: 'Bodø/Glimt', away: 'Inter Milan', group: 'Play-off Ida', stadium: 'Aspmyra Stadion' },
            { date: '2026-02-18T15:00:00Z', home: 'Club Brugge', away: 'Atletico Madrid', group: 'Play-off Ida', stadium: 'Jan Breydel Stadium' },

            // PLAY-OFFS VUELTA (Feb 24, 2026)
            { date: '2026-02-24T12:45:00Z', home: 'Atletico Madrid', away: 'Club Brugge', group: 'Play-off Vuelta', stadium: 'Metropolitano' },
            { date: '2026-02-24T15:00:00Z', home: 'Newcastle', away: 'Qarabağ', group: 'Play-off Vuelta', stadium: 'St James Park' },
            { date: '2026-02-24T15:00:00Z', home: 'Bayer Leverkusen', away: 'Olympiacos', group: 'Play-off Vuelta', stadium: 'BayArena' },
            { date: '2026-02-24T15:00:00Z', home: 'Inter Milan', away: 'Bodø/Glimt', group: 'Play-off Vuelta', stadium: 'San Siro' },

            // PLAY-OFFS VUELTA (Feb 25, 2026)
            { date: '2026-02-25T12:45:00Z', home: 'Atalanta', away: 'Borussia Dortmund', group: 'Play-off Vuelta', stadium: 'Gewiss Stadium' },
            { date: '2026-02-25T15:00:00Z', home: 'Real Madrid', away: 'Benfica', group: 'Play-off Vuelta', stadium: 'Santiago Bernabéu' },
            { date: '2026-02-25T15:00:00Z', home: 'PSG', away: 'Monaco', group: 'Play-off Vuelta', stadium: 'Parc des Princes' },
            { date: '2026-02-25T15:00:00Z', home: 'Juventus', away: 'Galatasaray', group: 'Play-off Vuelta', stadium: 'Allianz Stadium' },
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
                    awayScore: null,
                    homeFlag: FLAGS[mData.home] || null,
                    awayFlag: FLAGS[mData.away] || null
                } as any);
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
