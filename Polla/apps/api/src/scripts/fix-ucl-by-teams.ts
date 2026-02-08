import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Match } from '../database/entities/match.entity';
import { DataSource, In } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const matchRepo = dataSource.getRepository(Match);

  console.log('🚀 Starting Team-Name Based Tournament Fix...');

  const uclTeams = [
    'Manchester City',
    'Juventus',
    'Real Madrid',
    'Benfica',
    'Liverpool',
    'AC Milan',
    'Arsenal',
    'PSV',
    'Atletico Madrid',
    'Club Brugge',
    'Inter Milan',
    'Bayer Leverkusen',
    'Bayern Munich',
    'Sporting CP',
    'PSG',
    'Feyenoord',
  ];

  // Fix matches where either home or away team is in the UCL list
  // AND the tournamentId is WC2026

  // Method 1: Update by Home Team
  const res1 = await matchRepo
    .createQueryBuilder()
    .update(Match)
    .set({ tournamentId: 'UCL2526' })
    .where('homeTeam IN (:...teams)', { teams: uclTeams })
    .andWhere("tournamentId = 'WC2026'")
    .execute();

  console.log(`✅ Updated ${res1.affected} matches by Home Team.`);

  // Method 2: Update by Away Team
  const res2 = await matchRepo
    .createQueryBuilder()
    .update(Match)
    .set({ tournamentId: 'UCL2526' })
    .where('awayTeam IN (:...teams)', { teams: uclTeams })
    .andWhere("tournamentId = 'WC2026'")
    .execute();

  console.log(`✅ Updated ${res2.affected} matches by Away Team.`);

  await app.close();
  process.exit(0);
}

bootstrap();
