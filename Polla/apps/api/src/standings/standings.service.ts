import { Injectable } from '@nestjs/common';
import { DEFAULT_TOURNAMENT_ID } from '../common/constants/tournament.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { GroupStandingOverride } from '../database/entities/group-standing-override.entity';

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
    @InjectRepository(GroupStandingOverride)
    private overridesRepository: Repository<GroupStandingOverride>,
  ) {}

  async calculateGroupStandings(
    group: string,
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
  ): Promise<TeamStanding[]> {
    // 1. Buscar todos los partidos finalizados del grupo
    const matches = await this.matchesRepository.find({
      where: {
        tournamentId: tournamentId,
        phase: 'GROUP',
        group: group,
        status: require('typeorm').In(['FINISHED', 'COMPLETED', 'FINALIZADO']),
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
      homeTeamStats.goalDifference =
        homeTeamStats.goalsFor - homeTeamStats.goalsAgainst;
      awayTeamStats.goalDifference =
        awayTeamStats.goalsFor - awayTeamStats.goalsAgainst;
    }

    // 3. Convertir a array y ordenar según reglas FIFA
    const standings = Array.from(teamStats.values());

    // Check for Manual Overrides
    const overrides = await this.overridesRepository.find({
      where: { group, tournamentId: tournamentId },
    });

    if (overrides.length > 0) {
      console.log(`⚠️ Applying Manual Overrides for Group ${group}`);
      // Map team -> manualPosition
      const overrideMap = new Map<string, number>();
      overrides.forEach((o) => overrideMap.set(o.team, o.manualPosition));

      standings.sort((a, b) => {
        const posA = overrideMap.get(a.team) ?? 999; // Default to bottom if not overridden
        const posB = overrideMap.get(b.team) ?? 999;
        return posA - posB;
      });
    } else {
      // Default FIFA Sort
      standings.sort((a, b) => {
        // 1. Mayor número de puntos obtenidos en todos los partidos de grupo
        if (b.points !== a.points) return b.points - a.points;

        // 2. Mayor diferencia de goles en todos los partidos de grupo
        if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;

        // 3. Mayor número de goles marcados en todos los partidos de grupo
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

        // --- Criterios adicionales FIFA ---
        // 4. Mayor número de puntos obtenidos en los partidos entre los equipos empatados
        // 5. Mayor diferencia de goles en los partidos entre los equipos empatados
        // 6. Mayor número de goles marcados en los partidos entre los equipos empatados
        // 7. Puntos por deportividad (Fair Play - se puede implementar con datos de tarjetas)
        // 8. Sorteo por la FIFA

        return 0; // Se mantiene el orden actual si hay empate total (sorteo implícito)
      });
    }

    // 4. Asignar posiciones
    standings.forEach((standing, index) => {
      standing.position = index + 1;
    });

    // LOGGING PARA DEPURACIÓN
    console.log(`📊 Tabla del Grupo ${group}:`);
    standings.forEach((s) => {
      console.log(
        `  ${s.position}. ${s.team}: ${s.points}pts (PJ:${s.played} G:${s.won} E:${s.drawn} P:${s.lost} GF:${s.goalsFor} GC:${s.goalsAgainst} DG:${s.goalDifference})`,
      );
    });

    return standings;
  }

  async saveGroupOverrides(
    group: string,
    overrides: { team: string; position: number }[],
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
  ) {
    // Delete existing overrides for this group and tournament (full replacement)
    await this.overridesRepository.delete({ group, tournamentId });

    // Save new ones
    const entities = overrides.map((o) =>
      this.overridesRepository.create({
        group,
        tournamentId,
        team: o.team,
        manualPosition: o.position,
      }),
    );

    return await this.overridesRepository.save(entities);
  }

  async getAllGroupStandings(
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
  ): Promise<{ [group: string]: TeamStanding[] }> {
    // Obtener todos los grupos únicos para el torneo especificado
    const groups = await this.matchesRepository
      .createQueryBuilder('match')
      .select('DISTINCT match.group', 'group')
      .where('match.tournamentId = :tournamentId', { tournamentId })
      .andWhere('match.phase = :phase', { phase: 'GROUP' })
      .andWhere('match.group IS NOT NULL')
      .getRawMany();

    const allStandings: { [group: string]: TeamStanding[] } = {};

    for (const { group } of groups) {
      allStandings[group] = await this.calculateGroupStandings(
        group,
        tournamentId,
      );
    }

    return allStandings;
  }

  /**
   * Calcula el ranking de los mejores terceros de todos los grupos
   */
  async calculateBestThirdsRanking(
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
  ): Promise<TeamStanding[]> {
    const allGroupStandings = await this.getAllGroupStandings(tournamentId);
    const thirdPlaces: TeamStanding[] = [];

    for (const group in allGroupStandings) {
      const standings = allGroupStandings[group];
      if (standings.length >= 3) {
        // Agregar el tercer lugar de este grupo
        thirdPlaces.push(standings[2]);
      }
    }

    // Ordenar los terceros según reglas FIFA
    thirdPlaces.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    // Asignar posiciones en el sub-ranking
    thirdPlaces.forEach((standing, index) => {
      standing.position = index + 1;
    });

    return thirdPlaces;
  }
}
