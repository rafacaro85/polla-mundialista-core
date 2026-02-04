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

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("❌ DATABASE_URL is missing");
    process.exit(1);
}

const AppDataSource = new DataSource({
    type: 'postgres',
    url: dbUrl,
    entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
    synchronize: true, // FORCE SYNC TO CREATE TABLES
    ssl: { rejectUnauthorized: false },
});

async function run() {
    try {
        console.log(`🔌 Conectando a ${dbUrl.split('@')[1]}...`);
        await AppDataSource.initialize();
        console.log('✅ Base de datos sincronizada (Tablas Creadas).');
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

run();
