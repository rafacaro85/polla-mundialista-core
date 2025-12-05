import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { StandingsService } from '../standings/standings.service';

@Injectable()
export class TournamentService {
    private readonly logger = new Logger(TournamentService.name);

    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        private standingsService: StandingsService,
    ) { }

    /**
     * Verifica si todos los partidos de un grupo están finalizados
     */
    async isGroupComplete(group: string): Promise<boolean> {
        const totalMatches = await this.matchesRepository.count({
            where: { phase: 'GROUP', group },
        });

        const finishedMatches = await this.matchesRepository.count({
            where: { phase: 'GROUP', group, status: 'FINISHED' },
        });

        return totalMatches > 0 && totalMatches === finishedMatches;
    }

    /**
     * Mapeo de placeholders a posiciones de grupo
     */
    private getPlaceholderMapping(): { [key: string]: { group: string; position: number } } {
        const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const mapping: { [key: string]: { group: string; position: number } } = {};

        for (const group of groups) {
            mapping[`1${group}`] = { group, position: 1 };
            mapping[`2${group}`] = { group, position: 2 };
        }

        return mapping;
    }

    /**
     * Promociona automáticamente los equipos clasificados de un grupo a octavos
     * IDEMPOTENTE: Puede ejecutarse múltiples veces sin duplicar datos
     */
    async promoteFromGroup(group: string): Promise<void> {
        this.logger.log(`🔄 Checking promotion for Group ${group}...`);

        // 1. Verificar si el grupo está completo
        const isComplete = await this.isGroupComplete(group);
        if (!isComplete) {
            this.logger.log(`⏳ Group ${group} is not complete yet. Skipping promotion.`);
            return;
        }

        // 2. Obtener tabla de posiciones
        const standings = await this.standingsService.calculateGroupStandings(group);

        if (standings.length < 2) {
            this.logger.warn(`⚠️ Group ${group} has less than 2 teams. Cannot promote.`);
            return;
        }

        const firstPlace = standings[0].team;
        const secondPlace = standings[1].team;

        this.logger.log(`📊 Group ${group} standings: 1st: ${firstPlace}, 2nd: ${secondPlace}`);

        // 2.5. Buscar banderas de los equipos clasificados desde partidos de grupo
        const groupMatches = await this.matchesRepository.find({
            where: { phase: 'GROUP', group },
        });

        let firstPlaceFlag: string | null = null;
        let secondPlaceFlag: string | null = null;

        for (const match of groupMatches) {
            if (match.homeTeam === firstPlace && match.homeFlag) {
                firstPlaceFlag = match.homeFlag;
            } else if (match.awayTeam === firstPlace && match.awayFlag) {
                firstPlaceFlag = match.awayFlag;
            }
            if (match.homeTeam === secondPlace && match.homeFlag) {
                secondPlaceFlag = match.homeFlag;
            } else if (match.awayTeam === secondPlace && match.awayFlag) {
                secondPlaceFlag = match.awayFlag;
            }
        }

        this.logger.log(`🏁 Flags found - ${firstPlace}: ${firstPlaceFlag}, ${secondPlace}: ${secondPlaceFlag}`);

        // 3. Buscar partidos de octavos con placeholders de este grupo
        const knockoutMatches = await this.matchesRepository.find({
            where: { phase: 'ROUND_16' },
        });

        let updatedCount = 0;

        for (const match of knockoutMatches) {
            let updated = false;

            // Actualizar equipo local si corresponde
            if (match.homeTeamPlaceholder === `1${group}` && match.homeTeam !== firstPlace) {
                match.homeTeam = firstPlace;
                match.homeFlag = firstPlaceFlag || ''; // COPIAR BANDERA (vacío si no hay)
                match.homeTeamPlaceholder = null; // Limpiar placeholder
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: homeTeam = ${firstPlace} (flag: ${firstPlaceFlag})`);
            } else if (match.homeTeamPlaceholder === `2${group}` && match.homeTeam !== secondPlace) {
                match.homeTeam = secondPlace;
                match.homeFlag = secondPlaceFlag || ''; // COPIAR BANDERA (vacío si no hay)
                match.homeTeamPlaceholder = null;
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: homeTeam = ${secondPlace} (flag: ${secondPlaceFlag})`);
            }

            // Actualizar equipo visitante si corresponde
            if (match.awayTeamPlaceholder === `1${group}` && match.awayTeam !== firstPlace) {
                match.awayTeam = firstPlace;
                match.awayFlag = firstPlaceFlag || ''; // COPIAR BANDERA (vacío si no hay)
                match.awayTeamPlaceholder = null;
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: awayTeam = ${firstPlace} (flag: ${firstPlaceFlag})`);
            } else if (match.awayTeamPlaceholder === `2${group}` && match.awayTeam !== secondPlace) {
                match.awayTeam = secondPlace;
                match.awayFlag = secondPlaceFlag || ''; // COPIAR BANDERA (vacío si no hay)
                match.awayTeamPlaceholder = null;
                updated = true;
                this.logger.log(`✅ Updated match ${match.id}: awayTeam = ${secondPlace} (flag: ${secondPlaceFlag})`);
            }

            if (updated) {
                await this.matchesRepository.save(match);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            this.logger.log(`🎉 Promotion complete for Group ${group}. Updated ${updatedCount} knockout matches.`);
        } else {
            this.logger.log(`ℹ️ No updates needed for Group ${group} (already promoted or no matching placeholders).`);
        }
    }

    /**
     * Promociona todos los grupos completos
     * Útil para ejecutar manualmente o en un cron job
     */
    async promoteAllCompletedGroups(): Promise<void> {
        const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        for (const group of groups) {
            try {
                await this.promoteFromGroup(group);
            } catch (error) {
                this.logger.error(`❌ Error promoting Group ${group}:`, error);
            }
        }
    }
}
