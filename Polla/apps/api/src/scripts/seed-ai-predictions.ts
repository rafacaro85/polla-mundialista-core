import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * AI Prediction Seeding Script
 * 
 * Purpose: Pre-generate AI predictions for all matches with defined teams
 * to prevent rate limit errors during user requests.
 * 
 * Usage: npm run seed:ai
 * 
 * Expected Duration: 10-15 minutes for ~48 group stage matches
 * (with 5-10 second throttle between requests)
 */

// Initialize Gemini AI
let genAI: any;
let model: any;

try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini AI initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
    process.exit(1);
}

// Database connection
const AppDataSource = process.env.DATABASE_URL
    ? new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Match],
        synchronize: false,
        ssl: { rejectUnauthorized: false },
    })
    : new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        entities: [Match],
        synchronize: false,
    });

/**
 * Sleep utility for throttling
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate prediction using Gemini API
 */
async function generatePrediction(match: Match) {
    const prompt = `Actúa como un analista deportivo experto. Sé breve y directo.

Analiza el siguiente partido de fútbol y predice el resultado:

**${match.homeTeam}** vs **${match.awayTeam}**
Fase: ${match.phase || 'Fase de Grupos'}
${match.stadium ? `Estadio: ${match.stadium}` : ''}

Responde ÚNICAMENTE en formato JSON válido (sin bloques de código markdown):
{
  "predictedScore": "X-Y",
  "confidence": "high|medium|low",
  "reasoning": "breve análisis de máximo 2 líneas"
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Clean JSON response
    const cleanText = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

    try {
        return JSON.parse(cleanText);
    } catch (parseError) {
        console.error(`[JSON PARSE ERROR] Raw: ${rawText}`);
        throw new Error('Invalid JSON response from Gemini');
    }
}

/**
 * Main seeding function
 */
async function seedAiPredictions() {
    try {
        console.log('🚀 Starting AI Prediction Seeding...\n');

        // Connect to database
        await AppDataSource.initialize();
        console.log('✅ Database connected\n');

        const matchRepository = AppDataSource.getRepository(Match);

        // Query matches that need predictions
        const matches = await matchRepository
            .createQueryBuilder('match')
            .where('match.homeTeam IS NOT NULL')
            .andWhere('match.awayTeam IS NOT NULL')
            .andWhere('match.aiPrediction IS NULL')
            .orderBy('match.date', 'ASC')
            .getMany();

        console.log(`📊 Found ${matches.length} matches without AI predictions\n`);

        if (matches.length === 0) {
            console.log('✅ All matches already have predictions. Nothing to do.');
            process.exit(0);
        }

        let successCount = 0;
        let errorCount = 0;

        // Process each match with throttling
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const progress = `[${i + 1}/${matches.length}]`;

            try {
                console.log(`${progress} Generating prediction for: ${match.homeTeam} vs ${match.awayTeam}`);

                // Generate prediction
                const prediction = await generatePrediction(match);

                // Save to database
                match.aiPrediction = JSON.stringify(prediction);
                match.aiPredictionScore = prediction.predictedScore;
                match.aiPredictionGeneratedAt = new Date();

                await matchRepository.save(match);

                console.log(`✅ ${progress} Saved: ${prediction.predictedScore} (${prediction.confidence})`);
                successCount++;

                // Throttle: Wait 5-10 seconds before next request
                if (i < matches.length - 1) {
                    const delay = Math.floor(Math.random() * 5000) + 5000; // 5-10 seconds
                    console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before next request...\n`);
                    await sleep(delay);
                }

            } catch (error) {
                console.error(`❌ ${progress} Error:`, error.message);
                errorCount++;

                // If rate limit error, wait longer
                if (error.status === 429 || error.message?.includes('429')) {
                    console.log('⚠️ Rate limit detected. Waiting 60 seconds...\n');
                    await sleep(60000);
                } else {
                    // Wait 10 seconds before continuing
                    await sleep(10000);
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📈 SEEDING COMPLETE');
        console.log('='.repeat(50));
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📊 Total: ${matches.length}`);
        console.log('='.repeat(50) + '\n');

        process.exit(0);

    } catch (error) {
        console.error('💥 Fatal error during seeding:', error);
        process.exit(1);
    }
}

// Run the seeder
seedAiPredictions();
