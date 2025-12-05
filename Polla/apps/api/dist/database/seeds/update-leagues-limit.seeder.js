"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../../app.module");
const league_entity_1 = require("../entities/league.entity");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    const leagueRepository = dataSource.getRepository(league_entity_1.League);
    console.log('🚀 Iniciando migración de límites de liga...');
    try {
        const result = await leagueRepository
            .createQueryBuilder()
            .update(league_entity_1.League)
            .set({ maxParticipants: 3 })
            .where('maxParticipants IS NULL OR maxParticipants = 100')
            .execute();
        console.log(`✅ Migración completada. Ligas actualizadas: ${result.affected}`);
    }
    catch (error) {
        console.error('❌ Error durante la migración:', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=update-leagues-limit.seeder.js.map