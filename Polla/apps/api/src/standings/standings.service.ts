import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';

export interface TeamStanding {
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    position: number;
}

@Injectable()
export class StandingsService {
    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
    ) { }

    async calculateGroupStandings(group: string): Promise<TeamStanding[]> {
        // 1. Buscar todos los partidos finalizados del grupo
        const matches = await this.matchesRepository.find({
            where: {
                phase: 'GROUP',
                group: group,
                status: 'FINISHED',
            },
        });

        // 2. Calcular estadísticas por equipo
        const teamStats = new Map<string, TeamStanding>();

        for (const match of matches) {
            if (match.homeScore === null || match.awayScore === null) continue;

            // Inicializar equipos si no existen
            if (!teamStats.has(match.homeTeam)) {
                teamStats.set(match.homeTeam, {
                    team: match.homeTeam,
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    goalDifference: 0,
                    points: 0,
                    position: 0,
                });
            }
            if (!teamStats.has(match.awayTeam)) {
                teamStats.set(match.awayTeam, {
                    team: match.awayTeam,
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    goalDifference: 0,
                    points: 0,
                    position: 0,
                });
            }

            const homeTeamStats = teamStats.get(match.homeTeam)!;
            const awayTeamStats = teamStats.get(match.awayTeam)!;

            // Actualizar estadísticas
            homeTeamStats.played++;
            awayTeamStats.played++;

            homeTeamStats.goalsFor += match.homeScore;
            homeTeamStats.goalsAgainst += match.awayScore;
            awayTeamStats.goalsFor += match.awayScore;
            awayTeamStats.goalsAgainst += match.homeScore;

            // Determinar resultado
            if (match.homeScore > match.awayScore) {
                // Victoria local
                homeTeamStats.won++;
                homeTeamStats.points += 3;
                awayTeamStats.lost++;
            } else if (match.homeScore < match.awayScore) {
                // Victoria visitante
                awayTeamStats.won++;
                awayTeamStats.points += 3;
                homeTeamStats.lost++;
            } else {
                // Empate
                homeTeamStats.drawn++;
                awayTeamStats.drawn++;
                homeTeamStats.points += 1;
                awayTeamStats.points += 1;
            }

            // Calcular diferencia de goles
            homeTeamStats.goalDifference = homeTeamStats.goalsFor - homeTeamStats.goalsAgainst;
            awayTeamStats.goalDifference = awayTeamStats.goalsFor - awayTeamStats.goalsAgainst;
        }

        // 3. Convertir a array y ordenar según reglas FIFA
        const standings = Array.from(teamStats.values());

        standings.sort((a, b) => {
            // Primero por puntos (descendente)
            if (b.points !== a.points) return b.points - a.points;

            // Luego por diferencia de goles (descendente)
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;

            // Finalmente por goles a favor (descendente)
            return b.goalsFor - a.goalsFor;
        });

        // 4. Asignar posiciones
        standings.forEach((standing, index) => {
            standing.position = index + 1;
        });

        // LOGGING PARA DEPURACIÓN
        console.log(`📊 Tabla del Grupo ${group}:`);
        standings.forEach(s => {
            console.log(`  ${s.position}. ${s.team}: ${s.points}pts (PJ:${s.played} G:${s.won} E:${s.drawn} P:${s.lost} GF:${s.goalsFor} GC:${s.goalsAgainst} DG:${s.goalDifference})`);
        });

        return standings;
    }

    async getAllGroupStandings(): Promise<{ [group: string]: TeamStanding[] }> {
        // Obtener todos los grupos únicos
        const groups = await this.matchesRepository
            .createQueryBuilder('match')
            .select('DISTINCT match.group', 'group')
            .where('match.phase = :phase', { phase: 'GROUP' })
            .andWhere('match.group IS NOT NULL')
            .getRawMany();

        const allStandings: { [group: string]: TeamStanding[] } = {};

        for (const { group } of groups) {
            allStandings[group] = await this.calculateGroupStandings(group);
        }

        return allStandings;
    }
}
