import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { User } from '../database/entities/user.entity';
import { AccessCode } from '../database/entities/access-code.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { League } from '../database/entities/league.entity';
import { Organization } from '../database/entities/organization.entity';
import { Notification } from '../database/entities/notification.entity';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    console.log('✅ Gemini AI initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
    process.exit(1);
}

// Database connection - support both local and production
const AppDataSource = process.env.DATABASE_URL
    ? new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
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
        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
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
            console.log('✅ No group stage matches found. Nothing to do.');
            await AppDataSource.destroy();
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

                // Throttle: Wait 120-130 seconds before next request (extreme safety for free tier)
                if (i < matches.length - 1) {
                    const delay = Math.floor(Math.random() * 10000) + 120000; // 120-130 seconds
                    console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before next request...\n`);
                    await sleep(delay);
                }

            } catch (error: any) {
                console.error(`❌ ${progress} Error:`, error.message);
                errorCount++;

                // If rate limit error (429), wait much longer
                if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota')) {
                    console.log('⚠️ Rate limit detected. Waiting 120 seconds for quota reset...\n');
                    await sleep(120000);
                    // Decrement i to retry this same match
                    i--;
                    errorCount--; // Don't count as error if we retry
                } else {
                    // Wait 15 seconds before continuing on other errors
                    await sleep(15000);
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

    } catch (error: any) {
        console.error('💥 Fatal error during seeding:', error);
        process.exit(1);
    }
}

// Run the seeder
seedAiPredictions();
