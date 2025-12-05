"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const tournament_service_1 = require("./tournament/tournament.service");
async function promoteAllGroups() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const tournamentService = app.get(tournament_service_1.TournamentService);
    try {
        console.log('🚀 Ejecutando promoción manual de todos los grupos...\n');
        await tournamentService.promoteAllCompletedGroups();
        console.log('\n✅ Promoción completada!');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await app.close();
    }
}
promoteAllGroups();
//# sourceMappingURL=promote-all.js.map