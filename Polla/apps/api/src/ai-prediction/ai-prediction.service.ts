import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiPredictionService {
  private readonly logger = new Logger(AiPredictionService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {
    this.initAi();
  }

  private initAi() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.genAI = genAI;
        this.model = genAI.getGenerativeModel({
            model: 'models/gemini-flash-latest',
        });
        this.logger.log('✅ Gemini AI initialized');
      } catch (err) {
        this.logger.error('Failed to initialize Gemini:', err.message);
      }
    } else {
      this.logger.warn('⚠️ GEMINI_API_KEY not found');
    }
  }

  private async ensureAiInitialized() {
    if (this.model) return true;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY not found in environment');
      return false;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.genAI = genAI;
      this.model = genAI.getGenerativeModel({
        model: 'models/gemini-flash-latest',
      });
      this.logger.log('✅ Gemini AI initialized on-demand');
      return true;
    } catch (error) {
      this.logger.error('⚠️ Failed to initialize Gemini AI:', error.message);
      return false;
    }
  }

  /**
   * Main entry point - READ-ONLY mode (no API calls)
   * Returns cached predictions or "pending" state
   */
  async getPrediction(matchId: string) {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // ✅ CACHE HIT - Return immediately
    if (match.aiPredictionScore) {
      try {
          const analysis = match.aiPrediction ? JSON.parse(match.aiPrediction) : null;
          return {
            cached: true,
            generatedAt: match.aiPredictionGeneratedAt,
            score: match.aiPredictionScore,
            analysis: analysis || { predictedScore: match.aiPredictionScore },
          };
      } catch (e) {
          this.logger.warn(`Failed to parse AI prediction for match ${matchId}`);
      }
    }

    return {
      cached: false,
      pending: true,
      generatedAt: null,
      score: '?-?',
      analysis: {
        predictedScore: '?-?',
        confidence: 'pending',
        reasoning: '⏳ La IA está analizando este cruce.',
      },
    };
  }

  /**
   * Bulk retrieval of predictions for multiple matches
   */
  async getBulkPredictions(matchIds: string[]) {
    try {
        const predictions: Record<string, [number, number]> = {};
        if (!matchIds || !matchIds.length) return predictions;

        // Ensure we have a valid list of UUIDs to avoid DB errors
        const validIds = matchIds.filter(id => id && id.length === 36);
        if (!validIds.length) return predictions;

        const matches = await this.matchRepository.find({
            where: { id: In(validIds) }
        });

        await this.ensureAiInitialized();

        for (const matchId of validIds) {
            const match = matches.find((m) => m.id === matchId);

            // 1. Check Cache
            if (match && match.aiPredictionScore) {
                const score = match.aiPredictionScore.split('-').map(Number);
                if (score.length === 2 && !isNaN(score[0]) && !isNaN(score[1])) {
                    predictions[matchId] = [score[0], score[1]] as [number, number];
                    continue;
                }
            }

            // 2. Generate or Fallback
            if (match && match.homeTeam && match.awayTeam) {
                try {
                    if (this.model) {
                        const gen = await this.generatePrediction(match);
                        await this.savePredictionToCache(match, gen);
                        const score = gen.predictedScore.split('-').map(Number);
                        predictions[matchId] = [score[0], score[1]] as [number, number];
                    } else {
                        throw new Error('AI Service Unavailable');
                    }
                } catch (e) {
                    this.logger.warn(`Using fallback for match ${matchId}: ${e.message}`);
                    const fallback = this.handleFallback(e, match);
                    const score = fallback.score.split('-').map(Number);
                    predictions[matchId] = [score[0], score[1]] as [number, number];
                }
            } else {
                predictions[matchId] = [0, 0];
            }
        }

        return predictions;
    } catch (error) {
        this.logger.error(`🔥 Fatal in getBulkPredictions: ${error.message}`);
        throw error;
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

    // 🗺️ Phase mapping for better AI context
    const phaseMap: Record<string, string> = {
      GROUP: 'Fase de Grupos',
      ROUND_32: 'Dieciseisavos de Final (Round of 32) - Partido Eliminatorio',
      ROUND_16: 'Octavos de Final - Partido Eliminatorio',
      QUARTER: 'Cuartos de Final - Partido Eliminatorio',
      SEMI: 'Semifinales - Partido Eliminatorio',
      '3RD_PLACE': 'Partido por el Tercer Puesto',
      FINAL: 'Final del Mundial',
    };

    const phaseName = phaseMap[match.phase] || match.phase || 'Fase de Grupos';

    const prompt = `Actúa como un analista deportivo experto de la ${match.tournamentId === 'UCL2526' ? 'UEFA Champions League' : 'Copa del Mundo'}. Sé breve y directo.
    
Analiza el siguiente partido de fútbol considerando el momento de forma de ambos equipos y su jerarquía en la competición:

**${match.homeTeam}** vs **${match.awayTeam}**
Competición: ${match.tournamentId === 'UCL2526' ? 'Champions League' : 'Mundial'}
Fase: ${phaseName}
${match.stadium ? `Estadio: ${match.stadium}` : ''}

${match.phase && match.phase !== 'GROUP' ? 'REGLA: Este es un partido de eliminatoria directa. Debe haber un ganador (puede haber prórroga/penaltis, pero predice el resultado final del partido).' : 'REGLA: En fase de grupos se permite el empate.'}

Instrucciones:
1. Proporciona un marcador REALISTA y VARIADO (ej: 0-0, 3-0, 1-2, 2-2, 1-0, etc.). Evita repetir siempre los mismos marcadores.
2. Sé objetivo. Si hay un equipo claramente superior, refléjalo en el marcador.
3. Responde ÚNICAMENTE en JSON válido.

Respuesta JSON:
{
  "predictedScore": "X-Y",
  "confidence": "high/medium/low",
  "reasoning": "Breve explicación de 2 frases en español sobre por qué ese resultado."
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
    this.logger.log(
      `[CACHE SAVED] Match ${match.id} - Score: ${prediction.predictedScore}`,
    );
  }

  /**
   * Generate and save prediction for background jobs
   * Used by event listeners when teams are assigned to knockout matches
   */
  async generateAndSave(matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      this.logger.error(`[GENERATE_AND_SAVE] Match ${matchId} not found`);
      return;
    }

    // Skip if already has VALID prediction (not a fallback)
    if (match.aiPrediction && match.aiPredictionScore && !match.aiPrediction.includes('error en servicio de IA')) {
      this.logger.log(
        `[GENERATE_AND_SAVE] Match ${matchId} already has valid prediction. Skipping.`,
      );
      return;
    }

    // Skip if teams are not defined
    if (!match.homeTeam || !match.awayTeam) {
      this.logger.warn(
        `[GENERATE_AND_SAVE] Match ${matchId} has undefined teams. Skipping.`,
      );
      return;
    }

    // Retry mechanism with exponential backoff
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        attempts++;
        this.logger.log(
          `[GENERATE_AND_SAVE] Generating prediction for ${match.homeTeam} vs ${match.awayTeam} (Attempt ${attempts}/${maxRetries})`,
        );
        const prediction = await this.generatePrediction(match);
        await this.savePredictionToCache(match, prediction);
        this.logger.log(`[GENERATE_AND_SAVE] ✅ Success for match ${matchId}`);
        return; // Success, exit function
      } catch (error) {
        this.logger.warn(
          `[GENERATE_AND_SAVE] Attempt ${attempts} failed: ${error.message}`,
        );
        
        if (attempts >= maxRetries) {
           // Let it fall to the catch block below for random fallback
           break; 
        }
        
        // Wait before retrying (1s, 2s, 4s...)
        const delay = Math.pow(2, attempts) * 1000;
        this.logger.log(`[GENERATE_AND_SAVE] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    try {
        // This block is just to define the scope for the fallback logic which uses 'error' variable from the catch
        throw new Error('Max retries exceeded');
    } catch (error) {

      this.logger.error(
        `[GENERATE_AND_SAVE] ❌ Error for match ${matchId}:`,
        error.message,
      );
      this.logger.error(`[GENERATE_AND_SAVE] Full error:`, error);

      // 🎲 RANDOM FALLBACK - Generate random score (0-3 goals each team)
      const homeGoals = Math.floor(Math.random() * 4);
      let awayGoals = Math.floor(Math.random() * 4);
      
      // In knockout phases, avoid draws
      if (match.phase && match.phase !== 'GROUP' && homeGoals === awayGoals) {
        awayGoals = homeGoals === 0 ? 1 : homeGoals - 1;
      }
      
      const randomScore = `${homeGoals}-${awayGoals}`;

      const fallback = {
        predictedScore: randomScore,
        confidence: 'low',
        reasoning:
          'Predicción generada automáticamente debido a error en servicio de IA',
      };

      match.aiPrediction = JSON.stringify(fallback);
      match.aiPredictionScore = fallback.predictedScore;
      match.aiPredictionGeneratedAt = new Date();
      await this.matchRepository.save(match);

      this.logger.log(
        `[GENERATE_AND_SAVE] Saved fallback prediction (${randomScore}) for match ${matchId}`,
      );
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

    this.logger.warn(
      `[FALLBACK] Match ${match.id} - Random Score: ${randomScore}`,
    );

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
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

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
