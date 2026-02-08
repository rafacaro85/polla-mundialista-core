import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentService } from './tournament.service';
import { Match } from '../database/entities/match.entity';
import { StandingsModule } from '../standings/standings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), StandingsModule],
  providers: [TournamentService],
  exports: [TournamentService],
})
export class TournamentModule {}
