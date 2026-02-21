const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function run() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'admin123',
        database: 'polla_mundialista'
    });

    try {
        await client.connect();
        console.log('✅ Conectado a la base de datos local');
        
        const email = 'admin@admin.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = 'Administrador Sistema';
        const nickname = 'admin';
        const role = 'SUPER_ADMIN';
        const isVerified = true;

        const query = `
            INSERT INTO users (id, email, password, full_name, nickname, role, is_verified, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (email) DO UPDATE 
            SET password = $2, role = $5, is_verified = $6
            RETURNING id;
        `;
        const res = await client.query(query, [email, hashedPassword, fullName, nickname, role, isVerified]);
        console.log('✅ Usuario admin@admin.com creado/actualizado Localmente con ID:', res.rows[0].id);
        console.log('🔑 Credenciales: admin@admin.com / admin');
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.message.includes('database "polla_mundialista" does not exist')) {
            console.log('💡 Intentando crear la base de datos...');
            // Not safe to create DB from inside script if not connected to postgres DB
        }
    } finally {
        await client.end();
    }
}

run();
