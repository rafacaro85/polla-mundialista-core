import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function checkKnockoutMatches() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    try {
        const result = await dataSource.query(`
      SELECT id, "homeTeamPlaceholder", "awayTeamPlaceholder", phase, "bracketId", date
      FROM matches 
      WHERE phase = 'ROUND_16'
      ORDER BY "bracketId"
    `);

        console.log('\n📊 Partidos de Octavos en la base de datos:\n');

        if (result.length === 0) {
            console.log('❌ No hay partidos de octavos. Necesitamos crearlos.');
        } else {
            console.log(`✅ Encontrados ${result.length} partidos de octavos:\n`);
            result.forEach((match: any) => {
                console.log(`  ${match.bracketId}. ${match.homeTeamPlaceholder || '???'} vs ${match.awayTeamPlaceholder || '???'} - ${new Date(match.date).toLocaleDateString()}`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await app.close();
    }
}

checkKnockoutMatches();
