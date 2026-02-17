import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
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

  // 🕒 CRON: Run every 5 minutes
  @Cron('*/5 * * * *')
  async syncLiveMatches() {
    this.logger.log('🔄 Running URGENT SYNC (Target: API-SPORTS Direct / Throttled Loop)');

    try {
      // 1. Find ALL active matches with an external ID (No Time Window check)
      const activeMatches = await this.matchesRepository.find({
        where: {
          status: Not('FINISHED'),
          externalId: Not(IsNull())
        }
      });

      if (activeMatches.length === 0) {
        this.logger.log('💤 No active matches to sync.');
        return;
      }

      this.logger.log(`🎯 Found ${activeMatches.length} matches to update.`);

      // 2. Individual Loop with PAUSE (Prevents 429 & 403)
      for (const match of activeMatches) {
        if (!match.externalId) continue;

        try {
          this.logger.log(`🔄 Syncing Match ID: ${match.externalId} (${match.homeTeam} vs ${match.awayTeam})...`);

          // USE DIRECT API KEY (Fallback to RAPIDAPI_KEY env var if needed)
          const apiKey = this.configService.get<string>('RAPIDAPI_KEY') || this.configService.get<string>('API_KEY');

          const options = {
            method: 'GET',
            url: 'https://v3.football.api-sports.io/fixtures', // DIRECT ENDPOINT
            params: { id: match.externalId },
            headers: {
              'x-apisports-key': apiKey, // DIRECT HEADER
            },
          };

          const response = await axios.request(options);
          
          if (response.data.response && response.data.response.length > 0) {
            await this.processFixtureData(response.data.response[0]);
          } else {
             if (response.data.errors) {
                 this.logger.warn(`⚠️ API Warning for match ${match.externalId}: ${JSON.stringify(response.data.errors)}`);
             }
          }

        } catch (innerError) {
          this.logger.error(`❌ Error syncing match ${match.externalId}: ${innerError.message}`);
        }

        // 🛑 THROTTLE: Wait 2 seconds between calls
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      this.logger.error('❌ CRITICAL ERROR in syncLiveMatches:', error);
    }
  }

  // 🛠️ HELPER: Process Single Fixture
  async processFixtureData(fixture: any): Promise<boolean> {
    try {
      const externalId = fixture.fixture.id;
      const statusShort = fixture.fixture.status.short;
      const homeScore = fixture.goals.home;
      const awayScore = fixture.goals.away;
      const elapsed = fixture.fixture.status.elapsed;

      const match = await this.matchesRepository.findOne({
        where: { externalId: Number(externalId) }, 
      });

      if (!match) return false;

      if (match.isManuallyLocked) return false;

      const hasChanged =
        match.homeScore !== homeScore ||
        match.awayScore !== awayScore ||
        match.status !== 'FINISHED'; 

      if (hasChanged) {
        if (!match.homeTeam) match.homeTeam = fixture.teams.home.name;
        if (!match.awayTeam) match.awayTeam = fixture.teams.away.name;
        
        match.homeScore = homeScore;
        match.awayScore = awayScore;

        if (elapsed !== null) match.minute = elapsed;

        // STATUS LOGIC
        if (['FT', 'AET', 'PEN'].includes(statusShort)) {
          if (match.status !== 'FINISHED') {
            match.status = 'FINISHED';
            await this.matchesRepository.save(match);
            
            this.logger.log(`🏁 Match ${match.id} FINISHED. Calculating points...`);
            await this.scoringService.calculatePointsForMatch(match.id);
            await this.tournamentService.promoteToNextRound(match);
          } else {
            await this.matchesRepository.save(match);
          }
        } 
        else if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'].includes(statusShort)) {
          if (match.status !== 'LIVE') {
            match.status = 'LIVE';
            this.logger.log(`🔴 Match ${match.id} is now LIVE.`);
          }
          await this.matchesRepository.save(match);
        }
        else {
           await this.matchesRepository.save(match);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error processing fixture data: ${error.message}`);
      return false;
    }
  }
}
