
import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Match } from '../database/entities/match.entity';

const NEW_DB_URL = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function testConnection() {
    console.log('🧪 Testing DB Connection WITH ENTITIES...');
    console.log('URL:', NEW_DB_URL);

    const ds = new DataSource({
        type: 'postgres',
        url: NEW_DB_URL,
        ssl: { rejectUnauthorized: false },
        entities: [User, Match],
        synchronize: false 
    });

    try {
        await ds.initialize();
        console.log('✅ Connection Successful (Entities Loaded)!');
        
        const count = await ds.getRepository(User).count();
        console.log(`📊 Found ${count} users.`);

        await ds.destroy();
    } catch (err) {
        console.error('❌ Connection Failed:', err);
    }
}

testConnection();
