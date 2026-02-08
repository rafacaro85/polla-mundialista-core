import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const repo = dataSource.getRepository(KnockoutPhaseStatus);

  console.log('🔍 Inspecting Knockout Phase Statuses...');

  const all = await repo.find();

  console.log('--- WC2026 Phases ---');
  all
    .filter((p) => p.tournamentId === 'WC2026')
    .forEach((p) => {
      console.log(`[WC2026] ${p.phase} (Unlocked: ${p.isUnlocked})`);
    });

  console.log('--- UCL2526 Phases ---');
  all
    .filter((p) => p.tournamentId === 'UCL2526')
    .forEach((p) => {
      console.log(`[UCL2526] ${p.phase} (Unlocked: ${p.isUnlocked})`);
    });

  // Check for 'PLAYOFF' in WC2026
  const invalidWC = all.filter(
    (p) => p.tournamentId === 'WC2026' && p.phase === 'PLAYOFF',
  );
  if (invalidWC.length > 0) {
    console.log('🚨 DETECTED INVALID PHASES IN WC2026:');
    invalidWC.forEach((p) => console.log(`❌ ${p.phase} is in WC2026!`));
  }

  // Check for 'GROUP' in UCL2526 (if applicable)
  const invalidUCL = all.filter(
    (p) =>
      p.tournamentId === 'UCL2526' &&
      (p.phase === 'GROUP' || p.phase === 'ROUND_32'),
  );
  if (invalidUCL.length > 0) {
    console.log('🚨 DETECTED INVALID PHASES IN UCL2526:');
    invalidUCL.forEach((p) => console.log(`❌ ${p.phase} is in UCL2526!`));
  }

  await app.close();
  process.exit(0);
}

bootstrap();
