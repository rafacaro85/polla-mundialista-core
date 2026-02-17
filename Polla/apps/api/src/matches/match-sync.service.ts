import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm'; // Added IsNull
import { Match } from '../database/entities/match.entity';
import { ScoringService } from '../scoring/scoring.service';
import { TournamentService } from '../tournament/tournament.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatchSyncService {
  private readonly logger = new Logger(MatchSyncService.name);

  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private scoringService: ScoringService,
    private tournamentService: TournamentService,
    private configService: ConfigService,
  ) {}

  // 🕒 CRON: Ejecutar cada 5 minutos
  @Cron('*/5 * * * *')
  async syncLiveMatches() {
    this.logger.log('🔄 Running URGENT SYNC (Individual Loop / Time Window Disabled)');

    try {
      // 1. Buscar TODOS los partidos activos que tengan ID externo
      // Sin filtro de fecha para evitar problemas de zona horaria
      const activeMatches = await this.matchesRepository.find({
        where: {
          status: Not('FINISHED'),
          externalId: Not(IsNull()) // Correct usage of IsNull
        }
      });

      if (activeMatches.length === 0) {
        this.logger.log('💤 No hay partidos activos para sincronizar.');
        return;
      }

      this.logger.log(`🎯 Encontrados ${activeMatches.length} partidos para actualizar.`);

      // 2. Bucle INDIVIDUAL (Evita Error 403 de la API por Batch)
      for (const match of activeMatches) {
        if (!match.externalId) continue;

        try {
          this.logger.log(`🔄 Syncing Match ID: ${match.externalId} (${match.homeTeam} vs ${match.awayTeam})...`);

          const options = {
            method: 'GET',
            url: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
            params: { id: match.externalId }, // Llamada individual
            headers: {
              'x-rapidapi-key': this.configService.get<string>('RAPIDAPI_KEY'),
              'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
            },
          };

          const response = await axios.request(options);
          
          if (response.data.response && response.data.response.length > 0) {
            // Procesamos la respuesta
            await this.processFixtureData(response.data.response[0]);
          }

        } catch (innerError) {
          this.logger.error(`❌ Error syncing match ${match.externalId}: ${innerError.message}`);
          // Continuamos con el siguiente aunque este falle
        }
      }

    } catch (error) {
      this.logger.error('❌ Error CRÍTICO en syncLiveMatches:', error);
    }
  }

  // 🛠️ FUNCIÓN AUXILIAR: Procesa los datos de UN partido
  // Esta función debe estar DENTRO de la clase, antes de la última llave }
  async processFixtureData(fixture: any): Promise<boolean> {
    try {
      const externalId = fixture.fixture.id;
      const statusShort = fixture.fixture.status.short; // '1H', 'HT', 'FT', etc.
      const homeScore = fixture.goals.home;
      const awayScore = fixture.goals.away;

      // Buscar el partido en DB
      // Convertimos a number por seguridad y tipo correcto
      const match = await this.matchesRepository.findOne({
        where: { externalId: Number(externalId) }, 
      });

      if (!match) return false;

      // Si está bloqueado manualmente, no tocar
      if (match.isManuallyLocked) {
        this.logger.log(`🔒 Partido ${match.id} bloqueado manualmente. Saltando.`);
        return false;
      }

      // Detectar cambios
      const hasChanged =
        match.homeScore !== homeScore ||
        match.awayScore !== awayScore ||
        match.status !== 'FINISHED'; 

      if (hasChanged) {
        // Actualizar Nombres (solo si están vacíos para no borrar ediciones manuales)
        if (!match.homeTeam) match.homeTeam = fixture.teams.home.name;
        if (!match.awayTeam) match.awayTeam = fixture.teams.away.name;
        
        // Actualizar Marcador
        match.homeScore = homeScore;
        match.awayScore = awayScore;

        // Actualizar Minuto
        if (fixture.fixture.status.elapsed !== null) {
          match.minute = fixture.fixture.status.elapsed;
        }

        // --- LÓGICA DE ESTADOS ---

        // CASO 1: FINALIZADO
        if (['FT', 'AET', 'PEN'].includes(statusShort)) {
          if (match.status !== 'FINISHED') {
            match.status = 'FINISHED';
            await this.matchesRepository.save(match); // Guardar estado antes de calcular
            
            this.logger.log(`🏁 Partido ${match.id} FINALIZADO. Calculando puntos...`);
            
            // 🔥 DISPARAR CÁLCULO DE PUNTOS
            await this.scoringService.calculatePointsForMatch(match.id);
            
            // AVANZAR RONDA
            await this.tournamentService.promoteToNextRound(match);
          } else {
            await this.matchesRepository.save(match);
          }
        } 
        // CASO 2: EN VIVO
        else if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'].includes(statusShort)) {
          if (match.status !== 'LIVE') {
            match.status = 'LIVE';
            this.logger.log(`🔴 Partido ${match.id} ahora está EN VIVO.`);
          }
          await this.matchesRepository.save(match);
        }
        // CASO 3: OTROS (NS, SUSP, etc)
        else {
           await this.matchesRepository.save(match);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error procesando fixture data: ${error.message}`);
      return false;
    }
  }
}
