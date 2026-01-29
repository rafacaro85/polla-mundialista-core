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
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.logger.log('✅ Gemini AI initialized successfully');
      } catch (error) {
        this.logger.warn('⚠️ Failed to initialize Gemini AI:', error.message);
      }
    } else {
      this.logger.warn('⚠️ GEMINI_API_KEY not found in environment');
    }
  }

  /**
   * Main entry point - implements cache-first pattern
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

    // ❌ CACHE MISS - Generate new prediction
    this.logger.log(`[CACHE MISS] Match ${matchId} - ${match.homeTeam} vs ${match.awayTeam}`);

    try {
      const prediction = await this.generatePrediction(match);
      await this.savePredictionToCache(match, prediction);
      return {
        cached: false,
        generatedAt: new Date(),
        score: prediction.predictedScore,
        analysis: prediction,
      };
    } catch (error) {
      this.logger.error(`[GEMINI ERROR] ${error.message}`);
      return this.handleFallback(error, match);
    }
  }

  /**
   * Generates prediction using Gemini API
   * Includes JSON cleaning and improved prompt
   */
  private async generatePrediction(match: Match) {
    if (!this.model) {
      throw new Error('Gemini AI not initialized');
    }

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
