const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const dbConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        ssl: false
      };

const client = new Client(dbConfig);

async function run() {
    await client.connect();
    
    console.log('📦 Checking for missing AI columns in matches table and fixing casing...');
    
    // First, try to drop the camelCase columns if they exist (to clean up previous attempt)
    const cleanupQueries = [
        `ALTER TABLE matches DROP COLUMN IF EXISTS "aiPrediction"`,
        `ALTER TABLE matches DROP COLUMN IF EXISTS "aiPredictionScore"`,
        `ALTER TABLE matches DROP COLUMN IF EXISTS "aiPredictionGeneratedAt"`
    ];

    for (const q of cleanupQueries) {
        try {
            await client.query(q);
            console.log(`✅ Cleaned up: ${q}`);
        } catch(err) {
            console.warn(`⚠️ Warning cleanup: ${q}`, err.message);
        }
    }

    const queries = [
        `ALTER TABLE matches ADD COLUMN IF NOT EXISTS "ai_prediction" text`,
        `ALTER TABLE matches ADD COLUMN IF NOT EXISTS "ai_prediction_score" varchar(10)`,
        `ALTER TABLE matches ADD COLUMN IF NOT EXISTS "ai_prediction_generated_at" timestamp`
    ];

    for (const q of queries) {
        try {
            await client.query(q);
            console.log(`✅ Executed: ${q}`);
        } catch(err) {
            console.error(`❌ Error executing ${q}:`, err.message);
        }
    }
    
    console.log('✅ Matches table schema updated.');
    await client.end();
}

run();
