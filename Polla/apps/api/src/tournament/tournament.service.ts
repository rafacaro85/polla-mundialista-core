import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { StandingsService } from '../standings/standings.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TournamentService {
    private readonly logger = new Logger(TournamentService.name);

    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        private standingsService: StandingsService,
        private eventEmitter: EventEmitter2,
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

        // 2.1 CLEANUP PREVENTIVO (Autocorrección)
        // Antes de escribir los nuevos clasificados, buscamos si los equipos de este grupo
        // ya habían sido asignados previamente a algún bracket incorrecto (por cambios en la tabla)
        // y los limpiamos. Esto evita duplicados como "Alemania vs X" y "Alemania vs Y".
        const groupTeams = standings.map(s => s.team);
        
        // Buscamos cualquier partido de ROUND_32 que tenga como equipo (home o away) 
        // a alguno de los miembros de este grupo, y lo reseteamos si no coincide con la nueva realidad.
        const dirtyMatches = await this.matchesRepository.createQueryBuilder('m')
            .where("m.phase = 'ROUND_32'")
            .andWhere(
                "(m.homeTeam IN (:...teams) OR m.awayTeam IN (:...teams))", 
                { teams: groupTeams }
            )
            .getMany();

        for (const m of dirtyMatches) {
            let wasCleaned = false;
            // Si el homeTeam es del grupo, pero NO debería estar ahí según los placeholders (1A, 2A, etc), limpiar.
            // Ojo: Si el placeholder ya se borró (es null), asumimos que si el equipo está ahí, 
            // es porque venía de ese placeholder. 
            // La estrategia más segura es: Si el equipo está ahí, lo borramos y restauramos el placeholder original 
            // (si podemos deducirlo) o simplemente lo borramos y dejamos que el paso 3 lo reasigne correctamente.
            
            // Para simplificar y ser agresivos contra el bug:
            // Borramos SIEMPRE los equipos del grupo encontrados en R32.
            // El paso 3 (abajo) volverá a escribir los correctos donde deben ir.
            
            if (groupTeams.includes(m.homeTeam)) {
                // Restaurar placeholder si es posible, o dejarlo null si ya estaba null.
                // PERO: Necesitamos el placeholder para saber donde escribir después.
                // Si el placeholder es null, tenemos un problema: perdimos la "dirección" del slot.
                // Por suerte, en la DB el seed inicial tiene los placeholders.
                // Si el usuario no borró la DB, podemos intentar inferirlo o simplemente borrar el team.
                // Si borramos el team y el placeholder es null, el paso 3 no encontrará dónde escribir.
                // SOLUCIÓN: El paso 3 busca por placeholder. 
                // Si el placeholder es null porque ya se usó, debemos restaurarlo al borrar el equipo.
                
                // ¿Cómo sabemos qué placeholder era? 
                // Hardcode inverso o mapa. 
                // Por ahora, asumiremos que si limpiamos el equipo, debemos reactivar la búsqueda por placeholder.
                
                // MEJOR ESTRATEGIA:
                // No borrar a ciegas. Solo borrar si la posición NO coincide.
                // Pero es complejo validar "si coincide" aquí.
                
                // ESTRATEGIA "RESET SLOT":
                // Si encontramos un equipo del grupo, lo quitamos.
                // Y PARA QUE EL PASO 3 FUNCIONE: Debemos asegurarnos que el match tenga el placeholder correcto.
                // Como no tenemos el mapa inverso a mano fácilmente sin hardcodear los 104 partidos...
                // Vamos a confiar en que el seed inicial tenía los placeholders y en que 
                // al asignar un equipo, NO borremos el placeholder de la DB de forma permanente 
                // (aunque la lógica actual hacía `match.placeholder = null`).
                
                // CAMBIO CLAVE EN PASO 3: NO hacer `match.placeholder = null`.
                // Dejar el placeholder ahí para futuras referencias o correcciones.
                
                m.homeTeam = ''; 
                m.homeFlag = '';
                wasCleaned = true;
            }
            if (groupTeams.includes(m.awayTeam)) {
                m.awayTeam = '';
                m.awayFlag = '';
                wasCleaned = true;
            }

            if (wasCleaned) {
                await this.matchesRepository.save(m);
                this.logger.log(`🧹 Cleaned dirty R32 match ${m.id} containing old group data`);
            }
        }

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
        // NOTA: Buscamos matches donde el placeholder coincida.
        // Si en ejecuciones anteriores borramos el placeholder (como hacía el código viejo),
        // esto fallará. Por eso es vital que el SEEDER y el RESET hayan restaurado placeholders.
        // O que cambiemos la lógica para NO borrar el placeholder al asignar equipo.
        
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

                // Si el placeholder coincide, asignamos el equipo.
                // IMPORTANTE: NO borramos el placeholder (a diferencia de antes) para permitir correcciones futuras.
                if (match[placeholderField] === placeholder) {
                     // Solo guardar si es diferente para evitar escrituras inútiles
                     if (match[teamField] !== team) {
                        match[teamField] = team;
                        match[flagField] = flag;
                        // match[placeholderField] = null; // <-- ELIMINADO: Mantener placeholder para integridad/corrección
                        return true;
                     }
                }
                return false;
            }

            if (updateTeam('home', firstPlace, firstPlaceFlag, `1${group}`)) updated = true;
            if (updateTeam('away', firstPlace, firstPlaceFlag, `1${group}`)) updated = true;
            if (updateTeam('home', secondPlace, secondPlaceFlag, `2${group}`)) updated = true;
            if (updateTeam('away', secondPlace, secondPlaceFlag, `2${group}`)) updated = true;

            if (updated) {
                await this.matchesRepository.save(match);
                // Emit event for AI prediction generation
                if (match.homeTeam && match.awayTeam) {
                    this.eventEmitter.emit('match.teams.assigned', {
                        matchId: match.id,
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam
                    });
                }
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

        // Obtener ranking de mejores terceros
        const bestThirds = await this.standingsService.calculateBestThirdsRanking();

        // Tomamos solo los 8 mejores terceros
        const qualifiers = bestThirds.slice(0, 8);

        if (qualifiers.length === 0) {
            this.logger.log(`⏳ No third-place teams available yet.`);
            return;
        }

        this.logger.log(`📊 Best Thirds: ${qualifiers.map((q, i) => `${i + 1}. ${q.team} (${q.points}pts)`).join(', ')}`);

        // 2. Buscar banderas
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

        // 3. Buscar partidos de ROUND_32 con placeholders de terceros (3RD-1 a 3RD-8)
        const knockoutMatches = await this.matchesRepository.find({
            where: { phase: 'ROUND_32' },
            order: { bracketId: 'ASC' }
        });

        let updatedCount = 0;

        // Asignar cada tercer lugar a su placeholder correspondiente
        for (let i = 0; i < qualifiers.length && i < 8; i++) {
            const qualifier = qualifiers[i];
            const placeholderToFind = `3RD-${i + 1}`;
            
            // Buscar el partido que tiene este placeholder
            for (const match of knockoutMatches) {
                let updated = false;

                // Verificar si el placeholder está en homeTeam
                if (match.homeTeamPlaceholder === placeholderToFind && !match.homeTeam) {
                    match.homeTeam = qualifier.team;
                    match.homeFlag = teamFlags[qualifier.team] || '';
                    updated = true;
                    this.logger.log(`   ✅ Assigned ${qualifier.team} to Match ${match.bracketId} (Home) - Placeholder: ${placeholderToFind}`);
                }

                // Verificar si el placeholder está en awayTeam
                if (match.awayTeamPlaceholder === placeholderToFind && !match.awayTeam) {
                    match.awayTeam = qualifier.team;
                    match.awayFlag = teamFlags[qualifier.team] || '';
                    updated = true;
                    this.logger.log(`   ✅ Assigned ${qualifier.team} to Match ${match.bracketId} (Away) - Placeholder: ${placeholderToFind}`);
                }

                if (updated) {
                    await this.matchesRepository.save(match);
                    
                    // Emit event if both teams are now assigned
                    if (match.homeTeam && match.awayTeam) {
                        this.eventEmitter.emit('match.teams.assigned', {
                            matchId: match.id,
                            homeTeam: match.homeTeam,
                            awayTeam: match.awayTeam
                        });
                    }
                    
                    updatedCount++;
                    break; // Pasar al siguiente qualifier
                }
            }
        }

        if (updatedCount > 0) {
            this.logger.log(`🎉 Best Thirds promotion complete. Updated ${updatedCount} Round 32 matches.`);
        } else {
            this.logger.log(`ℹ️ No Best Thirds to promote (already assigned or not enough completed groups).`);
        }
    }

    /**
     * Promociona el ganador de un partido de Fase Final a la siguiente ronda
     */
    async promoteToNextRound(match: Match): Promise<void> {
        // Aceptamos cualquier estado finalizado
        if (!['FINISHED', 'COMPLETED', 'FINALIZADO', 'PENALTIES'].includes(match.status)) return;
        if (!['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI'].includes(match.phase)) return;

        // Determine Winner
        let winnerTeam: string;
        let winnerFlag: string;

        // Check explicit winner field first if it exists (for penalties)
        // Adjust based on your entity. Assuming basic score comparison for now.
        const hScore = match.homeScore || 0;
        const aScore = match.awayScore || 0;

        if (hScore > aScore) {
            winnerTeam = match.homeTeam;
            winnerFlag = match.homeFlag;
        } else if (aScore > hScore) {
            winnerTeam = match.awayTeam;
            winnerFlag = match.awayFlag;
        } else {
            // Empate en fase final debe tener penales.
            // Si no hay info de penales, logueamos advertencia.
            this.logger.warn(`Draw in knockout match ${match.id} with no clear winner. Cannot promote.`);
            return;
        }

        const nextPhaseMap: Record<string, string> = {
            'ROUND_32': 'ROUND_16',
            'ROUND_16': 'QUARTER',
            'QUARTER': 'SEMI',
            'SEMI': 'FINAL',
        };

        const nextPhase = nextPhaseMap[match.phase];
        if (!nextPhase || !match.bracketId) return;

        const nextBracketId = Math.ceil(match.bracketId / 2);
        
        const nextMatch = await this.matchesRepository.findOne({
            where: { phase: nextPhase, bracketId: nextBracketId }
        });

        if (!nextMatch) {
            this.logger.warn(`Next match not found for ${match.phase} Bracket ${match.bracketId} -> ${nextPhase} Bracket ${nextBracketId}`);
            return;
        }

        // Determine Slot (Home or Away)
        // Odd -> Home, Even -> Away
        const isHomeSlot = match.bracketId % 2 !== 0;

        let updated = false;
        if (isHomeSlot) {
            if (nextMatch.homeTeam !== winnerTeam) {
                nextMatch.homeTeam = winnerTeam;
                nextMatch.homeFlag = winnerFlag;
                nextMatch.homeTeamPlaceholder = `W${match.bracketId}-Prev`; 
                updated = true;
            }
        } else {
            if (nextMatch.awayTeam !== winnerTeam) {
                nextMatch.awayTeam = winnerTeam;
                nextMatch.awayFlag = winnerFlag;
                nextMatch.awayTeamPlaceholder = `W${match.bracketId}-Prev`;
                updated = true;
            }
        }

        if (updated) {
            await this.matchesRepository.save(nextMatch);
            this.logger.log(`🚀 Promoted ${winnerTeam} to ${nextPhase} Match ${nextMatch.id} (${isHomeSlot ? 'Home' : 'Away'})`);
            
            // Emit event for AI prediction generation if both teams are now present
            if (nextMatch.homeTeam && nextMatch.awayTeam) {
                this.eventEmitter.emit('match.teams.assigned', {
                    matchId: nextMatch.id,
                    homeTeam: nextMatch.homeTeam,
                    awayTeam: nextMatch.awayTeam
                });
            }
        }

        // SPECIAL CASE: If this is a SEMI-FINAL, also promote the LOSER to 3RD_PLACE
        if (match.phase === 'SEMI') {
            const loserTeam = (hScore > aScore) ? match.awayTeam : match.homeTeam;
            const loserFlag = (hScore > aScore) ? match.awayFlag : match.homeFlag;

            const thirdPlaceMatch = await this.matchesRepository.findOne({
                where: { phase: '3RD_PLACE' }
            });

            if (thirdPlaceMatch) {
                let thirdPlaceUpdated = false;
                
                // Semi 1 loser -> Home, Semi 2 loser -> Away
                if (match.bracketId === 1) {
                    if (thirdPlaceMatch.homeTeam !== loserTeam) {
                        thirdPlaceMatch.homeTeam = loserTeam;
                        thirdPlaceMatch.homeFlag = loserFlag;
                        thirdPlaceMatch.homeTeamPlaceholder = `LSF-1`;
                        thirdPlaceUpdated = true;
                    }
                } else if (match.bracketId === 2) {
                    if (thirdPlaceMatch.awayTeam !== loserTeam) {
                        thirdPlaceMatch.awayTeam = loserTeam;
                        thirdPlaceMatch.awayFlag = loserFlag;
                        thirdPlaceMatch.awayTeamPlaceholder = `LSF-2`;
                        thirdPlaceUpdated = true;
                    }
                }

                if (thirdPlaceUpdated) {
                    await this.matchesRepository.save(thirdPlaceMatch);
                    this.logger.log(`🥉 Promoted ${loserTeam} (LOSER of Semi ${match.bracketId}) to 3RD_PLACE Match`);
                }
            }
        }
    }

    async promotePhaseWinners(phase: string): Promise<void> {
        this.logger.log(`🏁 Batch promoting winners for phase: ${phase}`);
        const matches = await this.matchesRepository.find({ where: { phase } });

        for (const match of matches) {
            // Check status leniently
            if (['FINISHED', 'COMPLETED', 'FINALIZADO'].includes(match.status)) {
                try {
                    await this.promoteToNextRound(match);
                } catch (e) {
                    this.logger.error(`Failed to promote match ${match.id}`, e);
                }
            }
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
