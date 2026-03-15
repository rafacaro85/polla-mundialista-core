
const { Client } = require('pg');

async function runQuery() {
  const client = new Client({
    connectionString: "postgresql://postgres:admin123@localhost:5432/polla_mundialista",
  });

  try {
    await client.connect();
    
    // Check if table exists
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'joker_config'
      );
    `);
    
    if (!res.rows[0].exists) {
      console.log('Creating joker_config table...');
      await client.query(`
        CREATE TABLE "joker_config" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tournamentId" character varying NOT NULL,
          "phase" character varying,
          "group" character varying,
          "maxJokers" integer NOT NULL,
          CONSTRAINT "PK_joker_config_id" PRIMARY KEY ("id")
        )
      `);

      console.log('Inserting initial config...');
      await client.query(`
        INSERT INTO joker_config (id, "tournamentId", phase, "group", "maxJokers")
        VALUES
          (gen_random_uuid(), 'WC2026', 'GROUP', null, 3),
          (gen_random_uuid(), 'WC2026', 'ROUND_32', null, 1),
          (gen_random_uuid(), 'WC2026', 'ROUND_16', null, 1),
          (gen_random_uuid(), 'WC2026', 'QUARTER', null, 1),
          (gen_random_uuid(), 'WC2026', 'SEMI', null, 1),
          (gen_random_uuid(), 'WC2026', 'FINAL', null, 1),
          (gen_random_uuid(), 'WC2026', '3RD_PLACE', null, 1),
          (gen_random_uuid(), 'UCL2526', null, 'LEG_1', 1),
          (gen_random_uuid(), 'UCL2526', null, 'LEG_2', 1)
      `);
      console.log('Done!');
    } else {
      console.log('joker_config already exists.');
    }
  } catch (err) {
    console.error('Error executing script:', err.stack);
  } finally {
    await client.end();
  }
}

runQuery();
