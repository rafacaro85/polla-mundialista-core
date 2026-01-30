import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';

@Injectable()
export class AiPredictionService {
  private readonly logger = new Logger(AiPredictionService.name);
  private genAI: any;
  private model: any;

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {
    // Initialize Gemini only if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
        this.logger.log('✅ Gemini AI initialized successfully');
      } catch (error) {
        this.logger.warn('⚠️ Failed to initialize Gemini AI:', error.message);
      }
    } else {
      this.logger.warn('⚠️ GEMINI_API_KEY not found in environment');
    }
  }

  /**
   * Main entry point - READ-ONLY mode (no API calls)
   * Returns cached predictions or "pending" state
   */
  async getPrediction(matchId: string) {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // ✅ CACHE HIT - Return immediately
    if (match.aiPrediction && match.aiPredictionScore) {
      this.logger.log(`[CACHE HIT] Match ${matchId} - ${match.homeTeam} vs ${match.awayTeam}`);
      return {
        cached: true,
        generatedAt: match.aiPredictionGeneratedAt,
        score: match.aiPredictionScore,
        analysis: JSON.parse(match.aiPrediction),
      };
    }

    // ❌ CACHE MISS - Return "pending" state (NO API CALL)
    this.logger.log(`[PENDING] Match ${matchId} - ${match.homeTeam} vs ${match.awayTeam}`);
    
    return {
      cached: false,
      pending: true,
      generatedAt: null,
      score: '?-?',
      analysis: {
        predictedScore: '?-?',
        confidence: 'pending',
        reasoning: '⏳ La IA está analizando este cruce. La predicción se generará automáticamente cuando los equipos estén confirmados.'
      }
    };
  }

  /**
   * Generates prediction using Gemini API
   * Includes JSON cleaning and improved prompt
   */
  private async generatePrediction(match: Match) {
    if (!this.model) {
      throw new Error('Gemini AI not initialized');
    }

    // 🗺️ Phase mapping for better AI context
    const phaseMap: Record<string, string> = {
      'GROUP': 'Fase de Grupos',
      'ROUND_32': 'Dieciseisavos de Final (Round of 32) - Partido Eliminatorio',
      'ROUND_16': 'Octavos de Final - Partido Eliminatorio',
      'QUARTER': 'Cuartos de Final - Partido Eliminatorio',
      'SEMI': 'Semifinales - Partido Eliminatorio',
      '3RD_PLACE': 'Partido por el Tercer Puesto',
      'FINAL': 'Final del Mundial',
    };

    const phaseName = phaseMap[match.phase] || match.phase || 'Fase de Grupos';

    const prompt = `Actúa como un analista deportivo experto. Sé breve y directo.

Analiza el siguiente partido de fútbol y predice el resultado:

**${match.homeTeam}** vs **${match.awayTeam}**
Fase: ${phaseName}
${match.stadium ? `Estadio: ${match.stadium}` : ''}

${match.phase && match.phase !== 'GROUP' ? 'IMPORTANTE: Este es un partido ELIMINATORIO. No hay empates en tiempo reglamentario si hay prórroga.' : ''}

Responde ÚNICAMENTE en formato JSON válido (sin bloques de código markdown):
{
  "predictedScore": "X-Y",
  "confidence": "high|medium|low",
  "reasoning": "breve análisis de máximo 2 líneas"
}`;

    const result = await this.model.generateContent(prompt);
    const rawText = result.response.text();

    // 🧹 JSON CLEANING - Remove markdown code blocks
    const cleanText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      this.logger.error(`[JSON PARSE ERROR] Raw: ${rawText}`);
      throw new Error('Invalid JSON response from Gemini');
    }
  }

  /**
   * Saves prediction to database for future reuse
   */
  private async savePredictionToCache(match: Match, prediction: any) {
    match.aiPrediction = JSON.stringify(prediction);
    match.aiPredictionScore = prediction.predictedScore;
    match.aiPredictionGeneratedAt = new Date();

    await this.matchRepository.save(match);
    this.logger.log(`[CACHE SAVED] Match ${match.id} - Score: ${prediction.predictedScore}`);
  }

  /**
   * Generate and save prediction for background jobs
   * Used by event listeners when teams are assigned to knockout matches
   */
  async generateAndSave(matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });

    if (!match) {
      this.logger.error(`[GENERATE_AND_SAVE] Match ${matchId} not found`);
      return;
    }

    // Skip if already has prediction
    if (match.aiPrediction && match.aiPredictionScore) {
      this.logger.log(`[GENERATE_AND_SAVE] Match ${matchId} already has prediction. Skipping.`);
      return;
    }

    // Skip if teams are not defined
    if (!match.homeTeam || !match.awayTeam) {
      this.logger.warn(`[GENERATE_AND_SAVE] Match ${matchId} has undefined teams. Skipping.`);
      return;
    }

    try {
      this.logger.log(`[GENERATE_AND_SAVE] Generating prediction for ${match.homeTeam} vs ${match.awayTeam}`);
      const prediction = await this.generatePrediction(match);
      await this.savePredictionToCache(match, prediction);
      this.logger.log(`[GENERATE_AND_SAVE] ✅ Success for match ${matchId}`);
    } catch (error) {
      this.logger.error(`[GENERATE_AND_SAVE] ❌ Error for match ${matchId}:`, error.message);
      
      // Save fallback prediction on error
      const fallback = {
        predictedScore: '1-1',
        confidence: 'low',
        reasoning: 'Predicción generada automáticamente debido a error en servicio de IA'
      };
      
      match.aiPrediction = JSON.stringify(fallback);
      match.aiPredictionScore = fallback.predictedScore;
      match.aiPredictionGeneratedAt = new Date();
      await this.matchRepository.save(match);
      
      this.logger.log(`[GENERATE_AND_SAVE] Saved fallback prediction for match ${matchId}`);
    }
  }

  /**
   * Fallback mechanism for rate limits and errors
   * Returns random prediction instead of static "1-1"
   */
  private handleFallback(error: any, match: Match) {
    const isRateLimit = error.status === 429 || error.message?.includes('429');

    // 🎲 RANDOM FALLBACK - Generate random score (0-3 goals each team)
    const homeGoals = Math.floor(Math.random() * 4);
    const awayGoals = Math.floor(Math.random() * 4);
    const randomScore = `${homeGoals}-${awayGoals}`;

    const fallbackAnalysis = {
      predictedScore: randomScore,
      confidence: 'low',
      reasoning: isRateLimit
        ? 'Predicción simulada debido a límite de API de Gemini'
        : 'Predicción simulada debido a error en servicio de IA',
    };

    this.logger.warn(`[FALLBACK] Match ${match.id} - Random Score: ${randomScore}`);

    return {
      cached: false,
      fallback: true,
      generatedAt: new Date(),
      score: randomScore,
      analysis: fallbackAnalysis,
    };
  }

  /**
   * Clears cache for a specific match (useful for re-generating predictions)
   */
  async clearCache(matchId: string) {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    match.aiPrediction = null;
    match.aiPredictionScore = null;
    match.aiPredictionGeneratedAt = null;

    await this.matchRepository.save(match);
    this.logger.log(`[CACHE CLEARED] Match ${matchId}`);

    return { message: 'Cache cleared successfully' };
  }
}
