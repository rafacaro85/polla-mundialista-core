import { DataSource } from 'typeorm';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [KnockoutPhaseStatus],
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
      entities: [KnockoutPhaseStatus],
      synchronize: false,
    });

async function resetKnockoutPhases() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const phaseRepo = AppDataSource.getRepository(KnockoutPhaseStatus);

    // Delete all existing phases
    console.log('🗑️  Deleting all existing knockout phases...');
    await phaseRepo.delete({});
    console.log('✅ All phases deleted');

    // Create phases for each tournament
    // IMPORTANTE: Incluir TODOS los torneos para no perder configuración
    const tournaments = [
      'WC2026', // Mundial 2026 real
      'DEMO_WC2026', // Demo (usa mismo tournamentId que WC2026 en partidos)
      'UCL2526', // Champions League 2025-2026
    ];

    for (const tournamentId of tournaments) {
      console.log(`\n🔄 Creating phases for ${tournamentId}...`);

      const phases = [
        {
          phase: 'GROUP',
          tournamentId,
          isUnlocked: true,
          unlockedAt: new Date(),
          allMatchesCompleted: false,
        },
        {
          phase: 'ROUND_32',
          tournamentId,
          isUnlocked: false,
          allMatchesCompleted: false,
        },
        {
          phase: 'ROUND_16',
          tournamentId,
          isUnlocked: false,
          allMatchesCompleted: false,
        },
        {
          phase: 'QUARTER',
          tournamentId,
          isUnlocked: false,
          allMatchesCompleted: false,
        },
        {
          phase: 'SEMI',
          tournamentId,
          isUnlocked: false,
          allMatchesCompleted: false,
        },
        {
          phase: 'FINAL',
          tournamentId,
          isUnlocked: false,
          allMatchesCompleted: false,
        },
      ];

      for (const phaseData of phases) {
        const phase = phaseRepo.create(phaseData);
        await phaseRepo.save(phase);
        console.log(
          `   ✅ Created ${phaseData.phase} (unlocked: ${phaseData.isUnlocked})`,
        );
      }

      console.log(`✅ Phases created for ${tournamentId}`);
    }

    console.log('\n🎉 Knockout phases reset successfully for ALL tournaments!');
    console.log('   - WC2026: Mundial 2026');
    console.log('   - DEMO_WC2026: Demo');
    console.log('   - UCL2526: Champions League');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting knockout phases:', error);
    process.exit(1);
  }
}

resetKnockoutPhases();
