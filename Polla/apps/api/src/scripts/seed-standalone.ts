
import { DataSource, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// --- INLINE ENTITIES ---

@Entity('matches')
class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'WC2026' })
  tournamentId: string;

  @Column()
  homeTeam: string;

  @Column()
  awayTeam: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ nullable: true })
  homeFlag: string;

  @Column({ nullable: true })
  awayFlag: string;

  @Column({ nullable: true }) // GROUP, ROUND_16, etc.
  phase: string;

  @Column({ nullable: true })
  group: string;

  @Column({ default: 'SCHEDULED' })
  status: string;
}

// --- SEEDER LOGIC ---

async function run() {
    console.log('🚀 Starting Standalone Seeder (Matches Only)...');
    
    // Connection String
    const dbUrl = 'postgresql://postgres:lAbqgwhmSALnYLFxmHHTEOyuzMqqzsRS@ballast.proxy.rlwy.net:50167/railway';

    const dataSource = new DataSource({
        type: 'postgres',
        url: dbUrl,
        entities: [Match],
        synchronize: false, 
        ssl: { rejectUnauthorized: false } 
    });

    try {
        await dataSource.initialize();
        console.log('✅ Connected to Railway DB!');

        const matchRepo = dataSource.getRepository(Match);

        // 1. Groups Data
        const groupsData = {
            'A': ['Mexico', 'Ethiopia', 'Russia', 'South Korea'],
            'B': ['Canada', 'France', 'Australia', 'Chile'],
            'C': ['USA', 'England', 'Iran', 'Serbia'],
            'D': ['Brazil', 'Egypt', 'Japan', 'Sweden'],
            'E': ['Spain', 'Ivory Coast', 'Saudi Arabia', 'Uruguay'],
            'F': ['Argentina', 'Nigeria', 'Qatar', 'Switzerland'],
            'G': ['Germany', 'Algeria', 'China', 'Paraguay'],
            'H': ['Belgium', 'Cameroon', 'India', 'Peru'],
            'I': ['Portugal', 'Ghana', 'Iraq', 'Colombia'],
            'J': ['Netherlands', 'Morocco', 'Uzbekistan', 'Ecuador'],
            'K': ['Italy', 'Senegal', 'UAE', 'Croatia'],
            'L': ['Denmark', 'Mali', 'Thailand', 'Poland'] 
        };

        // 2. Generate Matches
        // Use a unique tournament ID for this white label
        const TOURNAMENT_ID = 'FWC2026';

        const existing = await matchRepo.count({ where: { tournamentId: TOURNAMENT_ID } });
        if (existing > 0) {
            console.log(`⚠️ Matches for ${TOURNAMENT_ID} already exist (${existing}). Skipping.`);
        } else {
            console.log('⚽ Generating Matches...');
            let matchCount = 0;

            for (const [groupName, teams] of Object.entries(groupsData)) {
                // Round Robin: 6 matches per group
                // Indices: [0,1], [2,3], [0,2], [1,3], [0,3], [1,2]
                const pairings = [
                    [0, 1], [2, 3], 
                    [0, 2], [1, 3], 
                    [0, 3], [1, 2]  
                ];

                // Fake dates logic
                let baseDate = new Date('2026-06-11T12:00:00Z');
                const groupIdx = Object.keys(groupsData).indexOf(groupName);
                baseDate.setDate(baseDate.getDate() + groupIdx); 

                for (const [p1, p2] of pairings) {
                    const home = teams[p1];
                    const away = teams[p2];
                    
                    const match = matchRepo.create({
                        tournamentId: TOURNAMENT_ID,
                        homeTeam: home,
                        awayTeam: away,
                        homeFlag: `https://flagsapi.com/${getCountryCode(home)}/flat/64.png`,
                        awayFlag: `https://flagsapi.com/${getCountryCode(away)}/flat/64.png`,
                        date: new Date(baseDate.getTime() + matchCount * 1000 * 60 * 60 * 3), // Staggered
                        phase: 'GROUP_STAGE', // Using 'phase' col
                        group: groupName,
                        status: 'SCHEDULED'
                    });
                    
                    await matchRepo.save(match);
                    matchCount++;
                }
            }
            console.log(`✅ Succesfully inserted ${matchCount} matches for ${TOURNAMENT_ID}.`);
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await dataSource.destroy();
    }
}

function getCountryCode(name: string): string {
  const codes: {[key: string]: string} = {
    'Mexico': 'MX', 'Ethiopia': 'ET', 'Russia': 'RU', 'South Korea': 'KR',
    'Canada': 'CA', 'France': 'FR', 'Australia': 'AU', 'Chile': 'CL',
    'USA': 'US', 'England': 'GB', 'Iran': 'IR', 'Serbia': 'RS',
    'Brazil': 'BR', 'Egypt': 'EG', 'Japan': 'JP', 'Sweden': 'SE',
    'Spain': 'ES', 'Ivory Coast': 'CI', 'Saudi Arabia': 'SA', 'Uruguay': 'UY',
    'Argentina': 'AR', 'Nigeria': 'NG', 'Qatar': 'QA', 'Switzerland': 'CH',
    'Germany': 'DE', 'Algeria': 'DZ', 'China': 'CN', 'Paraguay': 'PY',
    'Belgium': 'BE', 'Cameroon': 'CM', 'India': 'IN', 'Peru': 'PE',
    'Portugal': 'PT', 'Ghana': 'GH', 'Iraq': 'IQ', 'Colombia': 'CO',
    'Netherlands': 'NL', 'Morocco': 'MA', 'Uzbekistan': 'UZ', 'Ecuador': 'EC',
    'Italy': 'IT', 'Senegal': 'SN', 'UAE': 'AE', 'Croatia': 'HR',
    'Denmark': 'DK', 'Mali': 'ML', 'Thailand': 'TH', 'Poland': 'PL'
  };
  return codes[name] || 'UN';
}

run();
