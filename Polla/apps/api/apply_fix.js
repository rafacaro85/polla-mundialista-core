const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/polla_mundialista' });
  const sql = `
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'league_participants_status_enum') THEN
            CREATE TYPE "public"."league_participants_status_enum" AS ENUM('PENDING', 'ACTIVE', 'REJECTED');
        END IF;
    END $$;

    ALTER TABLE "league_participants" 
    ADD COLUMN IF NOT EXISTS "status" "public"."league_participants_status_enum" NOT NULL DEFAULT 'ACTIVE';

    ALTER TABLE "league_participants" 
    ADD COLUMN IF NOT EXISTS "is_paid" boolean NOT NULL DEFAULT false;
  `;

  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sql);
    console.log('SQL script executed successfully');
  } catch (err) {
    console.error('SQL Execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
