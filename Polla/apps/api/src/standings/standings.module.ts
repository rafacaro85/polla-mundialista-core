import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StandingsService } from './standings.service';
import { StandingsController } from './standings.controller';
import { Match } from '../database/entities/match.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Match])],
    controllers: [StandingsController],
    providers: [StandingsService],
    exports: [StandingsService],
})
export class StandingsModule { }
