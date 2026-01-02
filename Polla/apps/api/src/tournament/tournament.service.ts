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

        // Contar acabados (aceptamos FINISHED o COMPLETED por compatibilidad)
        const finishedMatches = await this.matchesRepository.createQueryBuilder('match')
            .where('match.phase = :phase', { phase: 'GROUP' })
            .andWhere('match.group = :group', { group })
            .andWhere('match.status IN (:...statuses)', { statuses: ['FINISHED', 'COMPLETED', 'FINALIZADO'] })
            .getCount();

        this.logger.log(`Group ${group}: ${finishedMatches}/${totalMatches} matches finished.`);
        return totalMatches > 0 && totalMatches === finishedMatches;
    }

    /**
     * Mapeo de placeholders a posiciones de grupo
     */
    private getPlaceholderMapping(): { [key: string]: { group: string; position: number } } {
        const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        const mapping: { [key: string]: { group: string; position: number } } = {};

        for (const group of groups) {
            mapping[`1${group}`] = { group, position: 1 };
            mapping[`2${group}`] = { group, position: 2 };
            mapping[`3${group}`] = { group, position: 3 }; // Para los mejores terceros
        }

        return mapping;
    }

    /**
     * Promociona automáticamente los equipos clasificados de un grupo a Dieciseisavos (Round of 32)
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
        const thirdPlace = standings.length >= 3 ? standings[2].team : null;

        this.logger.log(`📊 Group ${group} standings: 1st: ${firstPlace}, 2nd: ${secondPlace}, 3rd: ${thirdPlace}`);

        // 2.5. Buscar banderas de los equipos clasificados
        const groupMatches = await this.matchesRepository.find({
            where: { phase: 'GROUP', group },
        });

        let firstPlaceFlag = '';
        let secondPlaceFlag = '';
        let thirdPlaceFlag = '';

        for (const match of groupMatches) {
            if (match.homeTeam === firstPlace) firstPlaceFlag = match.homeFlag || '';
            else if (match.awayTeam === firstPlace) firstPlaceFlag = match.awayFlag || '';

            if (match.homeTeam === secondPlace) secondPlaceFlag = match.homeFlag || '';
            else if (match.awayTeam === secondPlace) secondPlaceFlag = match.awayFlag || '';

            if (thirdPlace) {
                if (match.homeTeam === thirdPlace) thirdPlaceFlag = match.homeFlag || '';
                else if (match.awayTeam === thirdPlace) thirdPlaceFlag = match.awayFlag || '';
            }
        }

        // 3. Buscar partidos de ROUND_32 con placeholders de este grupo
        const knockoutMatches = await this.matchesRepository.find({
            where: { phase: 'ROUND_32' },
        });

        let updatedCount = 0;

        for (const match of knockoutMatches) {
            let updated = false;

            // Auxiliar para actualizar equipo
            const updateTeam = (side: 'home' | 'away', team: string, flag: string, placeholder: string) => {
                const teamField = side === 'home' ? 'homeTeam' : 'awayTeam';
                const flagField = side === 'home' ? 'homeFlag' : 'awayFlag';
                const placeholderField = side === 'home' ? 'homeTeamPlaceholder' : 'awayTeamPlaceholder';

                if (match[placeholderField] === placeholder && match[teamField] !== team) {
                    match[teamField] = team;
                    match[flagField] = flag;
                    match[placeholderField] = null;
                    return true;
                }
                return false;
            }

            if (updateTeam('home', firstPlace, firstPlaceFlag, `1${group}`)) updated = true;
            if (updateTeam('away', firstPlace, firstPlaceFlag, `1${group}`)) updated = true;
            if (updateTeam('home', secondPlace, secondPlaceFlag, `2${group}`)) updated = true;
            if (updateTeam('away', secondPlace, secondPlaceFlag, `2${group}`)) updated = true;

            if (updated) {
                await this.matchesRepository.save(match);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            this.logger.log(`🎉 Promotion complete for Group ${group}. Updated ${updatedCount} Round 32 matches.`);
        }
    }

    /**
     * Promociona los 8 mejores terceros a los partidos correspondientes
     * basados en el ranking global de terceros.
     */
    async promoteBestThirds(): Promise<void> {
        this.logger.log(`🔄 Checking promotion for Best Thirds...`);

        // 1. Obtener ranking de mejores terceros
        const bestThirds = await this.standingsService.calculateBestThirdsRanking();

        // Solo tomamos los 8 mejores
        const qualifiers = bestThirds.slice(0, 8);

        if (qualifiers.length === 0) return;

        // 2. Buscar banderas para estos equipos
        // (Necesitamos las banderas para actualizarlas en los partidos de knockout)
        const teamFlags: Record<string, string> = {};
        for (const q of qualifiers) {
            const match = await this.matchesRepository.findOne({
                where: [
                    { homeTeam: q.team, phase: 'GROUP' },
                    { awayTeam: q.team, phase: 'GROUP' }
                ]
            });
            if (match) {
                teamFlags[q.team] = match.homeTeam === q.team ? match.homeFlag || '' : match.awayFlag || '';
            }
        }

        // 3. Buscar partidos de ROUND_32 con placeholders de 3RD-X
        const knockoutMatches = await this.matchesRepository.find({
            where: { phase: 'ROUND_32' },
        });

        let updatedCount = 0;

        for (const match of knockoutMatches) {
            let updated = false;

            for (let i = 0; i < qualifiers.length; i++) {
                const team = qualifiers[i].team;
                const flag = teamFlags[team] || '';
                const placeholder = `3RD-${i + 1}`;

                // Ayudante para actualizar
                if (match.homeTeamPlaceholder === placeholder && match.homeTeam !== team) {
                    match.homeTeam = team;
                    match.homeFlag = flag;
                    match.homeTeamPlaceholder = null;
                    updated = true;
                }
                if (match.awayTeamPlaceholder === placeholder && match.awayTeam !== team) {
                    match.awayTeam = team;
                    match.awayFlag = flag;
                    match.awayTeamPlaceholder = null;
                    updated = true;
                }
            }

            if (updated) {
                await this.matchesRepository.save(match);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            this.logger.log(`🎉 Best Thirds promotion complete. Updated ${updatedCount} Round 32 matches.`);
        }
    }

    /**
     * Promociona todos los grupos completos
     */
    async promoteAllCompletedGroups(): Promise<void> {
        const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

        for (const group of groups) {
            try {
                await this.promoteFromGroup(group);
            } catch (error) {
                this.logger.error(`❌ Error promoting Group ${group}:`, error);
            }
        }

        // Promover mejores terceros después de actualizar todos los grupos
        try {
            await this.promoteBestThirds();
        } catch (error) {
            this.logger.error(`❌ Error promoting Best Thirds:`, error);
        }
    }
}
