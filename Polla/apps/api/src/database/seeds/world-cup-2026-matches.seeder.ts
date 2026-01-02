import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { User } from '../entities/user.entity';
import * as dotenv from 'dotenv';

import { join } from 'path';
import { AccessCode } from '../entities/access-code.entity';
import { BonusQuestion } from '../entities/bonus-question.entity';
import { KnockoutPhaseStatus } from '../entities/knockout-phase-status.entity';
import { LeagueComment } from '../entities/league-comment.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
import { SystemConfig } from '../entities/system-config.entity';
import { Transaction } from '../entities/transaction.entity';
import { UserBonusAnswer } from '../entities/user-bonus-answer.entity';
import { UserBracket } from '../entities/user-bracket.entity';

dotenv.config();

/**
 * SEEDER: Partidos del Mundial 2026
 * 
 * Datos oficiales del sorteo del 5 de diciembre de 2025
 * Fuente: FIFA.com
 * 
 * GRUPOS OFICIALES:
 * - Grupo A: México, Sudáfrica, Corea del Sur, UEFA Playoff D
 * - Grupo B: Canadá, UEFA Playoff A, Qatar, Suiza
 * - Grupo C: Brasil, Marruecos, Haití, Escocia
 * - Grupo D: Estados Unidos, Paraguay, Australia, UEFA Playoff C
 * - Grupo E: Alemania, Curazao, Costa de Marfil, Ecuador
 * - Grupo F: Países Bajos, Japón, UEFA Playoff B, Túnez
 * - Grupo G: Bélgica, Egipto, Irán, Nueva Zelanda
 * - Grupo H: España, Cabo Verde, Arabia Saudita, Uruguay
 * - Grupo I: Francia, Senegal, Playoff 2, Noruega
 * - Grupo J: Argentina, Argelia, Austria, Jordania
 * - Grupo K: Portugal, Playoff 1, Uzbekistán, Colombia
 * - Grupo L: Inglaterra, Croacia, Ghana, Panamá
 */

interface MatchData {
    group: string;
    date: string; // ISO format
    homeTeam: string;
    awayTeam: string;
    homeFlag: string; // ISO code (lowercase)
    awayFlag: string; // ISO code (lowercase)
    stadium: string;
    phase: string;
}

// ============================================================================
// DATOS DE LOS PARTIDOS DEL MUNDIAL 2026 - FASE DE GRUPOS
// ============================================================================

const matchesData: MatchData[] = [
    // =========================================================================
    // GRUPO A
    // =========================================================================
    {
        group: 'A',
        date: '2026-06-11T20:00:00.000Z', // 16:00 ET
        homeTeam: 'México',
        awayTeam: 'Sudáfrica',
        homeFlag: 'mx',
        awayFlag: 'za',
        stadium: 'Estadio Azteca, Ciudad de México',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-12T01:00:00.000Z', // 21:00 ET (11 Jun) -> 12 Jun UTC
        homeTeam: 'Corea del Sur',
        awayTeam: 'Grecia',
        homeFlag: 'kr',
        awayFlag: 'gr',
        stadium: 'Estadio Akron, Guadalajara',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-18T01:00:00.000Z', // 21:00 ET (17 Jun) -> 18 Jun UTC
        homeTeam: 'México',
        awayTeam: 'Corea del Sur',
        homeFlag: 'mx',
        awayFlag: 'kr',
        stadium: 'Estadio BBVA, Monterrey',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-18T01:00:00.000Z', // 21:00 ET (17 Jun) -> 18 Jun UTC
        homeTeam: 'Sudáfrica',
        awayTeam: 'Grecia',
        homeFlag: 'za',
        awayFlag: 'gr',
        stadium: 'Estadio Azteca, Ciudad de México',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-24T21:00:00.000Z', // 17:00 ET
        homeTeam: 'México',
        awayTeam: 'Grecia',
        homeFlag: 'mx',
        awayFlag: 'gr',
        stadium: 'Estadio Azteca, Ciudad de México',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-24T21:00:00.000Z', // 17:00 ET
        homeTeam: 'Sudáfrica',
        awayTeam: 'Corea del Sur',
        homeFlag: 'za',
        awayFlag: 'kr',
        stadium: 'Estadio BBVA, Monterrey',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO B
    // =========================================================================
    {
        group: 'B',
        date: '2026-06-12T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Canadá',
        awayTeam: 'Italia',
        homeFlag: 'ca',
        awayFlag: 'it',
        stadium: 'BMO Field, Toronto',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-13T01:00:00.000Z', // 21:00 ET (12 Jun) -> 13 Jun UTC
        homeTeam: 'Qatar',
        awayTeam: 'Suiza',
        homeFlag: 'qa',
        awayFlag: 'ch',
        stadium: 'Levi\'s Stadium, San Francisco Bay Area',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-18T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Canadá',
        awayTeam: 'Qatar',
        homeFlag: 'ca',
        awayFlag: 'qa',
        stadium: 'BC Place, Vancouver',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-19T01:00:00.000Z', // 21:00 ET (18 Jun) -> 19 Jun UTC
        homeTeam: 'Italia',
        awayTeam: 'Suiza',
        homeFlag: 'it',
        awayFlag: 'ch',
        stadium: 'Lumen Field, Seattle',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-24T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Canadá',
        awayTeam: 'Suiza',
        homeFlag: 'ca',
        awayFlag: 'ch',
        stadium: 'BC Place, Vancouver',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-24T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Italia',
        awayTeam: 'Qatar',
        homeFlag: 'it',
        awayFlag: 'qa',
        stadium: 'Lumen Field, Seattle',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO C
    // =========================================================================
    {
        group: 'C',
        date: '2026-06-14T01:00:00.000Z', // 21:00 ET (13 Jun) -> 14 Jun UTC
        homeTeam: 'Brasil',
        awayTeam: 'Marruecos',
        homeFlag: 'br',
        awayFlag: 'ma',
        stadium: 'SoFi Stadium, Los Angeles',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-13T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Haití',
        awayTeam: 'Escocia',
        homeFlag: 'ht',
        awayFlag: 'sco',
        stadium: 'Gillette Stadium, Boston',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-19T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Brasil',
        awayTeam: 'Escocia',
        homeFlag: 'br',
        awayFlag: 'sco',
        stadium: 'Hard Rock Stadium, Miami',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-19T16:00:00.000Z', // 12:00 ET
        homeTeam: 'Marruecos',
        awayTeam: 'Haití',
        homeFlag: 'ma',
        awayFlag: 'ht',
        stadium: 'Mercedes-Benz Stadium, Atlanta',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-24T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Brasil',
        awayTeam: 'Haití',
        homeFlag: 'br',
        awayFlag: 'ht',
        stadium: 'Hard Rock Stadium, Miami',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-24T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Marruecos',
        awayTeam: 'Escocia',
        homeFlag: 'ma',
        awayFlag: 'sco',
        stadium: 'Mercedes-Benz Stadium, Atlanta',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO D
    // =========================================================================
    {
        group: 'D',
        date: '2026-06-13T01:00:00.000Z', // 21:00 ET (12 Jun) -> 13 Jun UTC
        homeTeam: 'Estados Unidos',
        awayTeam: 'Paraguay',
        homeFlag: 'us',
        awayFlag: 'py',
        stadium: 'SoFi Stadium, Los Angeles',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-14T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Australia',
        awayTeam: 'Finlandia',
        homeFlag: 'au',
        awayFlag: 'fi',
        stadium: 'BC Place, Vancouver',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-20T02:00:00.000Z', // 22:00 ET (19 Jun) -> 20 Jun UTC
        homeTeam: 'Estados Unidos',
        awayTeam: 'Australia',
        homeFlag: 'us',
        awayFlag: 'au',
        stadium: 'Lumen Field, Seattle',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-19T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Paraguay',
        awayTeam: 'Finlandia',
        homeFlag: 'py',
        awayFlag: 'fi',
        stadium: 'Levi\'s Stadium, San Francisco Bay Area',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-26T02:00:00.000Z', // 22:00 ET (25 Jun) -> 26 Jun UTC
        homeTeam: 'Estados Unidos',
        awayTeam: 'Finlandia',
        homeFlag: 'us',
        awayFlag: 'fi',
        stadium: 'SoFi Stadium, Los Angeles',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-26T02:00:00.000Z', // 22:00 ET (25 Jun) -> 26 Jun UTC
        homeTeam: 'Paraguay',
        awayTeam: 'Australia',
        homeFlag: 'py',
        awayFlag: 'au',
        stadium: 'Levi\'s Stadium, San Francisco Bay Area',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO E
    // =========================================================================
    {
        group: 'E',
        date: '2026-06-14T21:00:00.000Z', // 17:00 ET
        homeTeam: 'Alemania',
        awayTeam: 'Curazao',
        homeFlag: 'de',
        awayFlag: 'cw',
        stadium: 'Lincoln Financial Field, Philadelphia',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-15T00:00:00.000Z', // 20:00 ET (14 Jun) -> 15 Jun UTC
        homeTeam: 'Costa de Marfil',
        awayTeam: 'Ecuador',
        homeFlag: 'ci',
        awayFlag: 'ec',
        stadium: 'MetLife Stadium, New York/New Jersey',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-20T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Alemania',
        awayTeam: 'Costa de Marfil',
        homeFlag: 'de',
        awayFlag: 'ci',
        stadium: 'BMO Field, Toronto',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-20T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Curazao',
        awayTeam: 'Ecuador',
        homeFlag: 'cw',
        awayFlag: 'ec',
        stadium: 'Lincoln Financial Field, Philadelphia',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-25T20:00:00.000Z', // 16:00 ET
        homeTeam: 'Alemania',
        awayTeam: 'Ecuador',
        homeFlag: 'de',
        awayFlag: 'ec',
        stadium: 'MetLife Stadium, New York/New Jersey',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-25T20:00:00.000Z', // 16:00 ET
        homeTeam: 'Curazao',
        awayTeam: 'Costa de Marfil',
        homeFlag: 'cw',
        awayFlag: 'ci',
        stadium: 'Lincoln Financial Field, Philadelphia',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO F
    // =========================================================================
    {
        group: 'F',
        date: '2026-06-14T21:00:00.000Z', // 17:00 ET
        homeTeam: 'Países Bajos',
        awayTeam: 'Japón',
        homeFlag: 'nl',
        awayFlag: 'jp',
        stadium: 'AT&T Stadium, Dallas',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-16T00:00:00.000Z', // 20:00 ET (15 Jun) -> 16 Jun UTC
        homeTeam: 'Suecia',
        awayTeam: 'Túnez',
        homeFlag: 'se',
        awayFlag: 'tn',
        stadium: 'NRG Stadium, Houston',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-20T23:00:00.000Z', // 19:00 ET
        homeTeam: 'Países Bajos',
        awayTeam: 'Suecia',
        homeFlag: 'nl',
        awayFlag: 'se',
        stadium: 'Arrowhead Stadium, Kansas City',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-20T23:00:00.000Z', // 19:00 ET
        homeTeam: 'Japón',
        awayTeam: 'Túnez',
        homeFlag: 'jp',
        awayFlag: 'tn',
        stadium: 'NRG Stadium, Houston',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-25T23:00:00.000Z', // 19:00 ET
        homeTeam: 'Países Bajos',
        awayTeam: 'Túnez',
        homeFlag: 'nl',
        awayFlag: 'tn',
        stadium: 'Arrowhead Stadium, Kansas City',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-25T23:00:00.000Z', // 19:00 ET
        homeTeam: 'Japón',
        awayTeam: 'Suecia',
        homeFlag: 'jp',
        awayFlag: 'se',
        stadium: 'AT&T Stadium, Dallas',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO G
    // =========================================================================
    {
        group: 'G',
        date: '2026-06-15T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Bélgica',
        awayTeam: 'Egipto',
        homeFlag: 'be',
        awayFlag: 'eg',
        stadium: 'Lumen Field, Seattle',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-16T02:00:00.000Z', // 22:00 ET (15 Jun) -> 16 Jun UTC
        homeTeam: 'Irán',
        awayTeam: 'Nueva Zelanda',
        homeFlag: 'ir',
        awayFlag: 'nz',
        stadium: 'BC Place, Vancouver',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-20T20:00:00.000Z', // 16:00 ET
        homeTeam: 'Bélgica',
        awayTeam: 'Irán',
        homeFlag: 'be',
        awayFlag: 'ir',
        stadium: 'Lumen Field, Seattle',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-20T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Egipto',
        awayTeam: 'Nueva Zelanda',
        homeFlag: 'eg',
        awayFlag: 'nz',
        stadium: 'BC Place, Vancouver',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-27T03:00:00.000Z', // 23:00 ET (26 Jun) -> 27 Jun UTC
        homeTeam: 'Bélgica',
        awayTeam: 'Nueva Zelanda',
        homeFlag: 'be',
        awayFlag: 'nz',
        stadium: 'BC Place, Vancouver',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-27T03:00:00.000Z', // 23:00 ET (26 Jun) -> 27 Jun UTC
        homeTeam: 'Egipto',
        awayTeam: 'Irán',
        homeFlag: 'eg',
        awayFlag: 'ir',
        stadium: 'Lumen Field, Seattle',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO H
    // =========================================================================
    {
        group: 'H',
        date: '2026-06-13T20:00:00.000Z', // 16:00 ET
        homeTeam: 'España',
        awayTeam: 'Cabo Verde',
        homeFlag: 'es',
        awayFlag: 'cv',
        stadium: 'Estadio Akron, Guadalajara',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-14T01:00:00.000Z', // 21:00 ET (13 Jun) -> 14 Jun UTC
        homeTeam: 'Arabia Saudí',
        awayTeam: 'Uruguay',
        homeFlag: 'sa',
        awayFlag: 'uy',
        stadium: 'Estadio BBVA, Monterrey',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-19T21:00:00.000Z', // 17:00 ET
        homeTeam: 'España',
        awayTeam: 'Arabia Saudí',
        homeFlag: 'es',
        awayFlag: 'sa',
        stadium: 'Estadio BBVA, Monterrey',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-19T21:00:00.000Z', // 17:00 ET
        homeTeam: 'Cabo Verde',
        awayTeam: 'Uruguay',
        homeFlag: 'cv',
        awayFlag: 'uy',
        stadium: 'Estadio Akron, Guadalajara',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-27T00:00:00.000Z', // 20:00 ET (26 Jun) -> 27 Jun UTC
        homeTeam: 'España',
        awayTeam: 'Uruguay',
        homeFlag: 'es',
        awayFlag: 'uy',
        stadium: 'Estadio Akron, Guadalajara',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-27T00:00:00.000Z', // 20:00 ET (26 Jun) -> 27 Jun UTC
        homeTeam: 'Cabo Verde',
        awayTeam: 'Arabia Saudí',
        homeFlag: 'cv',
        awayFlag: 'sa',
        stadium: 'NRG Stadium, Houston',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO I
    // =========================================================================
    {
        group: 'I',
        date: '2026-06-14T00:00:00.000Z', // 20:00 ET (13 Jun) -> 14 Jun UTC
        homeTeam: 'Francia',
        awayTeam: 'Senegal',
        homeFlag: 'fr',
        awayFlag: 'sn',
        stadium: 'Estadio Azteca, Ciudad de México',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-14T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Bolivia',
        awayTeam: 'Noruega',
        homeFlag: 'bo',
        awayFlag: 'no',
        stadium: 'Gillette Stadium, Boston',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-19T01:00:00.000Z', // 21:00 ET (18 Jun) -> 19 Jun UTC
        homeTeam: 'Francia',
        awayTeam: 'Bolivia',
        homeFlag: 'fr',
        awayFlag: 'bo',
        stadium: 'MetLife Stadium, New York/New Jersey',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-19T18:00:00.000Z', // 14:00 ET
        homeTeam: 'Senegal',
        awayTeam: 'Noruega',
        homeFlag: 'sn',
        awayFlag: 'no',
        stadium: 'BMO Field, Toronto',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-26T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Francia',
        awayTeam: 'Noruega',
        homeFlag: 'fr',
        awayFlag: 'no',
        stadium: 'Gillette Stadium, Boston',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-26T19:00:00.000Z', // 15:00 ET
        homeTeam: 'Senegal',
        awayTeam: 'Bolivia',
        homeFlag: 'sn',
        awayFlag: 'bo',
        stadium: 'BMO Field, Toronto',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO J
    // =========================================================================
    {
        group: 'J',
        date: '2026-06-14T23:00:00.000Z', // 19:00 ET
        homeTeam: 'Argentina',
        awayTeam: 'Argelia',
        homeFlag: 'ar',
        awayFlag: 'dz',
        stadium: 'Arrowhead Stadium, Kansas City',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-16T01:00:00.000Z', // 21:00 ET (15 Jun) -> 16 Jun UTC
        homeTeam: 'Austria',
        awayTeam: 'Jordania',
        homeFlag: 'at',
        awayFlag: 'jo',
        stadium: 'Levi\'s Stadium, San Francisco Bay Area',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-20T21:00:00.000Z', // 17:00 ET
        homeTeam: 'Argentina',
        awayTeam: 'Austria',
        homeFlag: 'ar',
        awayFlag: 'at',
        stadium: 'AT&T Stadium, Dallas',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-21T01:00:00.000Z', // 21:00 ET (20 Jun) -> 21 Jun UTC
        homeTeam: 'Argelia',
        awayTeam: 'Jordania',
        homeFlag: 'dz',
        awayFlag: 'jo',
        stadium: 'SoFi Stadium, Los Angeles',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-28T02:00:00.000Z', // 22:00 ET (27 Jun) -> 28 Jun UTC
        homeTeam: 'Argentina',
        awayTeam: 'Jordania',
        homeFlag: 'ar',
        awayFlag: 'jo',
        stadium: 'AT&T Stadium, Dallas',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-28T02:00:00.000Z', // 22:00 ET (27 Jun) -> 28 Jun UTC
        homeTeam: 'Argelia',
        awayTeam: 'Austria',
        homeFlag: 'dz',
        awayFlag: 'at',
        stadium: 'Arrowhead Stadium, Kansas City',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO K
    // =========================================================================
    {
        group: 'K',
        date: '2026-06-15T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Portugal',
        awayTeam: 'Repechaje K', // Corregido: Honduras eliminado
        homeFlag: 'fifa', // Flag genérico o el que desees
        awayFlag: 'un', // Flag intercontinental
        stadium: 'Gillette Stadium, Boston',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-16T18:00:00.000Z', // 14:00 ET
        homeTeam: 'Uzbekistán',
        awayTeam: 'Colombia',
        homeFlag: 'uz',
        awayFlag: 'co',
        stadium: 'MetLife Stadium, New York/New Jersey',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-21T01:00:00.000Z', // 21:00 ET (20 Jun) -> 21 Jun UTC
        homeTeam: 'Portugal',
        awayTeam: 'Uzbekistán',
        homeFlag: 'pt',
        awayFlag: 'uz',
        stadium: 'Arrowhead Stadium, Kansas City',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-21T22:00:00.000Z', // 18:00 ET
        homeTeam: 'Repechaje K',
        awayTeam: 'Colombia',
        homeFlag: 'un',
        awayFlag: 'co',
        stadium: 'Estadio BBVA, Monterrey',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-27T23:30:00.000Z', // 19:30 ET
        homeTeam: 'Portugal',
        awayTeam: 'Colombia',
        homeFlag: 'pt',
        awayFlag: 'co',
        stadium: 'Hard Rock Stadium, Miami',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-27T23:30:00.000Z', // 19:30 ET
        homeTeam: 'Repechaje K',
        awayTeam: 'Uzbekistán',
        homeFlag: 'un',
        awayFlag: 'uz',
        stadium: 'Mercedes-Benz Stadium, Atlanta',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO L
    // =========================================================================
    {
        group: 'L',
        date: '2026-06-12T23:00:00.000Z', // 19:00 ET
        homeTeam: 'Inglaterra',
        awayTeam: 'Croacia',
        homeFlag: 'gb-eng',
        awayFlag: 'hr',
        stadium: 'Lincoln Financial Field, Philadelphia',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-13T23:00:00.000Z', // 19:00 ET
        homeTeam: 'Ghana',
        awayTeam: 'Panamá',
        homeFlag: 'gh',
        awayFlag: 'pa',
        stadium: 'Estadio Akron, Guadalajara',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-18T20:00:00.000Z', // 16:00 ET
        homeTeam: 'Inglaterra',
        awayTeam: 'Ghana',
        homeFlag: 'gb-eng',
        awayFlag: 'gh',
        stadium: 'NRG Stadium, Houston',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-19T01:00:00.000Z', // 21:00 ET (18 Jun) -> 19 Jun UTC
        homeTeam: 'Croacia',
        awayTeam: 'Panamá',
        homeFlag: 'hr',
        awayFlag: 'pa',
        stadium: 'Estadio Azteca, Ciudad de México',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-27T21:00:00.000Z', // 17:00 ET
        homeTeam: 'Inglaterra',
        awayTeam: 'Panamá',
        homeFlag: 'gb-eng',
        awayFlag: 'pa',
        stadium: 'MetLife Stadium, New York/New Jersey',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-27T21:00:00.000Z', // 17:00 ET
        homeTeam: 'Croacia',
        awayTeam: 'Ghana',
        homeFlag: 'hr',
        awayFlag: 'gh',
        stadium: 'Lincoln Financial Field, Philadelphia',
        phase: 'GROUP',
    },
];

// ============================================================================
// FUNCIÓN PRINCIPAL DEL SEEDER
// ============================================================================

async function main() {
    console.log('🌍 Iniciando carga de partidos del Mundial 2026...\n');
    console.log('📅 Fase de Grupos: 48 partidos\n');

    // Configurar conexión a la base de datos
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        entities: [
            Match,
            Prediction,
            User,
            AccessCode,
            BonusQuestion,
            KnockoutPhaseStatus,
            LeagueComment,
            LeagueParticipant,
            League,
            Organization,
            SystemConfig,
            Transaction,
            UserBonusAnswer,
            UserBracket
        ],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');

        const matchRepository = dataSource.getRepository(Match);

        // Limpiar partidos existentes (opcional - comenta si no quieres borrar)
        console.log('🗑️  Limpiando partidos existentes...');
        await matchRepository.createQueryBuilder().delete().execute();
        console.log('✅ Partidos eliminados\n');

        // Insertar partidos
        console.log(`📝 Insertando ${matchesData.length} partidos...\n`);

        let insertedCount = 0;
        let errorCount = 0;

        for (const matchData of matchesData) {
            try {
                const match = matchRepository.create({
                    homeTeam: matchData.homeTeam,
                    awayTeam: matchData.awayTeam,
                    homeFlag: matchData.homeFlag,
                    awayFlag: matchData.awayFlag,
                    date: new Date(matchData.date),
                    group: matchData.group,
                    phase: matchData.phase,
                    homeScore: null,
                    awayScore: null,
                    status: 'PENDING',
                    isLocked: false,
                    homeTeamPlaceholder: matchData.homeTeam.includes('Playoff') || matchData.homeTeam === 'TBD' ? matchData.homeTeam : null,
                    awayTeamPlaceholder: matchData.awayTeam.includes('Playoff') || matchData.awayTeam === 'TBD' ? matchData.awayTeam : null,
                });

                await matchRepository.save(match);
                insertedCount++;

                console.log(
                    `✅ [${insertedCount}/${matchesData.length}] ${matchData.homeTeam} vs ${matchData.awayTeam} - Grupo ${matchData.group}`
                );
            } catch (error) {
                errorCount++;
                console.error(
                    `❌ Error insertando: ${matchData.homeTeam} vs ${matchData.awayTeam}`,
                    error
                );
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Partidos insertados: ${insertedCount}`);
        console.log(`❌ Errores: ${errorCount}`);
        console.log('='.repeat(60) + '\n');

        console.log('🎉 ¡Carga de partidos completada!\n');
        console.log('📌 NOTA: Los equipos marcados como "Playoff" se definirán en marzo 2026');
        console.log('📌 Los estadios específicos se anunciarán próximamente\n');
    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    } finally {
        await dataSource.destroy();
        console.log('✅ Conexión cerrada');
    }
}

// ============================================================================
// EJECUTAR SEEDER
// ============================================================================

main()
    .then(() => {
        console.log('\n✅ Seeder ejecutado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error ejecutando seeder:', error);
        process.exit(1);
    });
