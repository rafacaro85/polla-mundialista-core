const { Client } = require('pg');

const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function checkDemoUsers() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // 1. Identificar usuarios demo por email
        const demoEmails = [
            'demo@lapollavirtual.com',
            'demo-social@lapollavirtual.com'
        ];
        for (let i = 1; i <= 10; i++) {
            demoEmails.push(`player${i}@demo.com`);
        }

        console.log('\n🔍 Checking participation of demo users...');
        
        const result = await client.query(`
            SELECT u.email, u.id as user_id, lp.league_id, l.name as league_name
            FROM users u
            JOIN league_participants lp ON u.id = lp.user_id
            JOIN leagues l ON lp.league_id = l.id
            WHERE u.email = ANY($1)
            ORDER BY u.email;
        `, [demoEmails]);

        console.table(result.rows);

        const demoLeagues = [
            '00000000-0000-0000-0000-000000001337',
            '00000000-0000-0000-0000-000000001338'
        ];

        const invalidParticipation = result.rows.filter(r => !demoLeagues.includes(r.league_id));

        if (invalidParticipation.length > 0) {
            console.log('\n⚠️ Found demo users in REAL leagues:');
            console.table(invalidParticipation);
        } else {
            console.log('\n✅ Demo users are ONLY in demo leagues.');
            
            // Si solo están en ligas demo, ¿por qué salen en el ranking global?
            // Quizás el ranking global incluye las ligas demo por error.
            console.log('\n🔍 Checking if Global Ranking includes demo leagues...');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

checkDemoUsers();
