import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function resetKnockoutStage() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🧹 PASO A: Limpiando fase final (conservando grupos)...');

    // Eliminar todos los partidos que NO sean de fase de grupos
    const deleteResult = await dataSource.query(`
            DELETE FROM matches WHERE phase != 'GROUP' OR phase IS NULL
        `);

    console.log(
      `✅ Eliminados ${deleteResult[1] || 0} partidos de fases finales\n`,
    );

    console.log(
      '🏗️  PASO B: Reconstruyendo Octavos de Final con placeholders FIFA...\n',
    );

    // Fecha base para los octavos
    const baseDate = new Date('2026-07-01T16:00:00Z');

    /**
     * ESTRUCTURA FIFA CORRECTA PARA EVITAR CRUCES PREMATUROS:
     *
     * LADO SUPERIOR (Semifinal 1):
     *   Match 49 (bracketId 1): 1A vs 2B  ─┐
     *   Match 50 (bracketId 2): 1C vs 2D  ─┴─> Cuarto 1 ─┐
     *   Match 51 (bracketId 3): 1E vs 2F  ─┐             │
     *   Match 52 (bracketId 4): 1G vs 2H  ─┴─> Cuarto 2 ─┴─> Semi 1 ─┐
     *
     * LADO INFERIOR (Semifinal 2):                                    │
     *   Match 53 (bracketId 5): 1B vs 2A  ─┐                          │
     *   Match 54 (bracketId 6): 1D vs 2C  ─┴─> Cuarto 3 ─┐           │
     *   Match 55 (bracketId 7): 1F vs 2E  ─┐             │           │
     *   Match 56 (bracketId 8): 1H vs 2G  ─┴─> Cuarto 4 ─┴─> Semi 2 ─┴─> FINAL
     */

    const knockoutMatches = [
      // LADO SUPERIOR - Semifinal 1
      { num: 49, home: '1A', away: '2B', bracket: 1, day: 0 },
      { num: 50, home: '1C', away: '2D', bracket: 2, day: 0 },
      { num: 51, home: '1E', away: '2F', bracket: 3, day: 1 },
      { num: 52, home: '1G', away: '2H', bracket: 4, day: 1 },

      // LADO INFERIOR - Semifinal 2
      { num: 53, home: '1B', away: '2A', bracket: 5, day: 2 },
      { num: 54, home: '1D', away: '2C', bracket: 6, day: 2 },
      { num: 55, home: '1F', away: '2E', bracket: 7, day: 3 },
      { num: 56, home: '1H', away: '2G', bracket: 8, day: 3 },
    ];

    for (const m of knockoutMatches) {
      const matchDate = new Date(
        baseDate.getTime() + m.day * 24 * 60 * 60 * 1000,
      );

      await dataSource.query(
        `
                INSERT INTO matches (
                    "homeTeam", "awayTeam", "homeTeamPlaceholder", "awayTeamPlaceholder",
                    phase, "bracketId", date, status, "homeScore", "awayScore"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `,
        [
          '',
          '',
          m.home,
          m.away,
          'ROUND_16',
          m.bracket,
          matchDate,
          'SCHEDULED',
          null,
          null,
        ],
      );

      console.log(
        `  ✅ Match ${m.num} (Bracket ${m.bracket}): ${m.home} vs ${m.away}`,
      );
    }

    console.log(`\n🎉 Reseteo completado exitosamente!`);
    console.log(
      `📊 ${knockoutMatches.length} partidos de Octavos creados con placeholders FIFA`,
    );
    console.log(`\n📋 Estructura del bracket:`);
    console.log(`   Lado Superior (Semi 1): Brackets 1-4`);
    console.log(`   Lado Inferior (Semi 2): Brackets 5-8`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

resetKnockoutStage();
