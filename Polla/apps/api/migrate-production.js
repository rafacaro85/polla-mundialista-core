const { Client } = require('pg');
async function run() {
  const dbUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_PUBLIC_URL (o DATABASE_URL) no encontrada en el entorno');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // Requerido para Railway fuera de su red interna
  });

  try {
    await client.connect();
    console.log('📡 Connected to Railway Production DB');

    const sql = `
-- 1. Asegurar que el tipo ENUM para el estado del participante exista
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'league_participants_status_enum') THEN
        CREATE TYPE "league_participants_status_enum" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
    END IF;
END $$;

-- 2. Cambios en la tabla 'league_participants'
DO $$ 
BEGIN
    -- Agregar columna 'status' si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'league_participants' AND column_name = 'status') THEN
        ALTER TABLE "league_participants" 
        ADD COLUMN "status" "league_participants_status_enum" DEFAULT 'ACTIVE';
    END IF;

    -- Agregar columna 'is_paid' si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'league_participants' AND column_name = 'is_paid') THEN
        ALTER TABLE "league_participants" 
        ADD COLUMN "is_paid" boolean DEFAULT false;
    END IF;
END $$;

-- 3. Cambios en la tabla 'leagues'
DO $$ 
BEGIN
    -- Agregar columna 'prize_type' si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leagues' AND column_name = 'prize_type') THEN
        ALTER TABLE "leagues" 
        ADD COLUMN "prize_type" varchar DEFAULT 'image';
    END IF;

    -- Agregar columna 'prize_amount' si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leagues' AND column_name = 'prize_amount') THEN
        ALTER TABLE "leagues" 
        ADD COLUMN "prize_amount" decimal(15,2);
    END IF;
END $$;
    `;

    await client.query(sql);
    console.log('✅ Database schema updated successfully in production');
  } catch (err) {
    console.error('❌ Error during migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
