"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const matches_service_1 = require("./matches/matches.service");
async function resetKnockout() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const matchesService = app.get(matches_service_1.MatchesService);
    try {
        console.log('🔄 Reseteando partidos de octavos...');
        const result = await matchesService.resetKnockoutMatches();
        console.log('✅', result.message);
        console.log(`📊 Partidos reseteados: ${result.reset}`);
    }
    catch (error) {
        console.error('❌ Error durante el reseteo:', error);
    }
    finally {
        await app.close();
    }
}
resetKnockout();
//# sourceMappingURL=reset-knockout.js.map