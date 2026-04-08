const { Client } = require('pg');

// Usando la cadena de conexión de producción que tienes en query_leagues_production.js
const client = new Client({ 
    connectionString: 'postgresql://postgres:lAbqgwhmSALnYLFxmHHTEOyuzMqqzsRS@ballast.proxy.rlwy.net:50167/railway' 
});

client.connect().then(async () => {
    console.log('Conectado a Producción (Railway)...');

    // 1. Añadir el valor PENDING al Enum
    try {
        console.log('Agregando estado PENDING al Enum de la base de datos...');
        await client.query(`ALTER TYPE "league_status_enum" ADD VALUE IF NOT EXISTS 'PENDING'`);
        console.log('✅ Estado PENDING agregado exitosamente.');
    } catch (err) {
        if (err.message.includes('ya existe') || err.message.includes('already exists')) {
            console.log('✅ El estado PENDING ya existía en el Enum.');
        } else {
            console.error('⚠️ Error (es posible que el nombre del enum sea distinto):', err.message);
            try {
                // Alternativa de nombre si TypeORM lo nombró diferente
                await client.query(`ALTER TYPE "leagues_status_enum" ADD VALUE IF NOT EXISTS 'PENDING'`);
                console.log('✅ Estado PENDING agregado exitosamente con nombre alternativo.');
            } catch (err2) {
                console.error('⚠️ Fallo en el segundo intento:', err2.message);
            }
        }
    }

    client.end();
}).catch(err => { 
    console.error('Error de conexión:', err); 
    process.exit(1); 
});
