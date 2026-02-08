import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Match } from '../database/entities/match.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const matchRepo = dataSource.getRepository(Match);

  console.log('🔍 Listing ALL matches tagged as WC2026...');

  const matches = await matchRepo.find({
    where: { tournamentId: 'WC2026' },
    order: { date: 'ASC' },
  });

  console.log(`Found ${matches.length} matches for WC2026.`);

  // Filter for potential intruders (Club teams)
  // WC Teams are usually countries. Clubs have specific names.
  // Converting known Club names or checking exclude list?
  // Let's just print names of matches in Feb 2026 (UCL dates)

  const intruders = matches.filter((m) => {
    const d = new Date(m.date);
    // Check for Feb 2026 or matches with Club names like 'City', 'Inter', 'Real', etc.
    return (
      (d.getFullYear() === 2026 && d.getMonth() === 1) || // Feb is month 1
      m.homeTeam.includes('City') ||
      m.homeTeam.includes('Madrid') ||
      m.homeTeam.includes('Munich') ||
      m.homeTeam.includes('Inter')
    );
  });

  if (intruders.length > 0) {
    console.log('🚨 DETECTED INTRUDERS IN WC2026:');
    intruders.forEach((m) => {
      console.log(
        `❌ [${m.id}] ${m.homeTeam} vs ${m.awayTeam} (${m.date}) - Phase: ${m.phase}`,
      );
    });
  } else {
    console.log(
      '✅ No obvious intruders found in WC2026 (Feb dates or major clubs).',
    );
  }

  await app.close();
  process.exit(0);
}

bootstrap();
