const { Client } = require('pg');
const bcrypt = require('bcrypt');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    
    const email = 'admin@admin.com';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = 'Administrador Sistema';
    const nickname = 'admin';
    const role = 'SUPER_ADMIN';
    const isVerified = true;

    try {
        const query = `
            INSERT INTO users (id, email, password, full_name, nickname, role, is_verified, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (email) DO UPDATE 
            SET password = $2, role = $5, is_verified = $6
            RETURNING id;
        `;
        const res = await client.query(query, [email, hashedPassword, fullName, nickname, role, isVerified]);
        console.log('✅ Usuario admin@admin.com creado/actualizado con ID:', res.rows[0].id);
        console.log('🔑 Credenciales: admin@admin.com / admin');
    } catch (err) {
        console.error('❌ Error creando usuario:', err);
    } finally {
        await client.end();
    }
}

run();
