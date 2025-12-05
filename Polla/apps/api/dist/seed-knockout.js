"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const matches_service_1 = require("./matches/matches.service");
async function seedKnockout() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const matchesService = app.get(matches_service_1.MatchesService);
    try {
        console.log('🌱 Iniciando seeding de partidos de octavos...');
        const result = await matchesService.seedKnockoutMatches();
        console.log('✅', result.message);
        console.log(`📊 Partidos creados: ${result.created}`);
    }
    catch (error) {
        console.error('❌ Error durante el seeding:', error);
    }
    finally {
        await app.close();
    }
}
seedKnockout();
//# sourceMappingURL=seed-knockout.js.map