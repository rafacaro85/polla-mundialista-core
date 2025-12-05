"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
async function checkKnockoutMatches() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
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
        }
        else {
            console.log(`✅ Encontrados ${result.length} partidos de octavos:\n`);
            result.forEach((match) => {
                console.log(`  ${match.bracketId}. ${match.homeTeamPlaceholder || '???'} vs ${match.awayTeamPlaceholder || '???'} - ${new Date(match.date).toLocaleDateString()}`);
            });
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await app.close();
    }
}
checkKnockoutMatches();
//# sourceMappingURL=check-knockout.js.map