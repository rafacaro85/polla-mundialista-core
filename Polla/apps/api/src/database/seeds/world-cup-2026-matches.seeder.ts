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
    // GRUPO A: México, Sudáfrica, Corea del Sur, UEFA Playoff D
    // =========================================================================
    {
        group: 'A',
        date: '2026-06-11T20:00:00.000Z', // 11 de junio, 3:00 PM ET
        homeTeam: 'México',
        awayTeam: 'Sudáfrica',
        homeFlag: 'mx',
        awayFlag: 'za',
        stadium: 'Estadio Azteca, Ciudad de México',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-12T01:00:00.000Z',
        homeTeam: 'Corea del Sur',
        awayTeam: 'Grecia', // Ficticio por UEFA Playoff D
        homeFlag: 'kr',
        awayFlag: 'gr',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-16T20:00:00.000Z',
        homeTeam: 'México',
        awayTeam: 'Corea del Sur',
        homeFlag: 'mx',
        awayFlag: 'kr',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-16T23:00:00.000Z',
        homeTeam: 'Sudáfrica',
        awayTeam: 'Grecia',
        homeFlag: 'za',
        awayFlag: 'gr',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-21T20:00:00.000Z',
        homeTeam: 'México',
        awayTeam: 'Grecia',
        homeFlag: 'mx',
        awayFlag: 'gr',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'A',
        date: '2026-06-21T20:00:00.000Z',
        homeTeam: 'Sudáfrica',
        awayTeam: 'Corea del Sur',
        homeFlag: 'za',
        awayFlag: 'kr',
        stadium: 'TBD',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO B: Canadá, UEFA Playoff A, Qatar, Suiza
    // =========================================================================
    {
        group: 'B',
        date: '2026-06-12T18:00:00.000Z',
        homeTeam: 'Canadá',
        awayTeam: 'Italia', // Ficticio por UEFA Playoff A
        homeFlag: 'ca',
        awayFlag: 'it',
        stadium: 'BMO Field, Toronto',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-13T21:00:00.000Z',
        homeTeam: 'Qatar',
        awayTeam: 'Suiza',
        homeFlag: 'qa',
        awayFlag: 'ch',
        stadium: 'Levi\'s Stadium, San Francisco Bay Area',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-17T18:00:00.000Z',
        homeTeam: 'Canadá',
        awayTeam: 'Qatar',
        homeFlag: 'ca',
        awayFlag: 'qa',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-17T21:00:00.000Z',
        homeTeam: 'Italia',
        awayTeam: 'Suiza',
        homeFlag: 'it',
        awayFlag: 'ch',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-22T18:00:00.000Z',
        homeTeam: 'Canadá',
        awayTeam: 'Suiza',
        homeFlag: 'ca',
        awayFlag: 'ch',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'B',
        date: '2026-06-22T18:00:00.000Z',
        homeTeam: 'Italia',
        awayTeam: 'Qatar',
        homeFlag: 'it',
        awayFlag: 'qa',
        stadium: 'TBD',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO C: Brasil, Marruecos, Haití, Escocia
    // =========================================================================
    {
        group: 'C',
        date: '2026-06-12T23:00:00.000Z',
        homeTeam: 'Brasil',
        awayTeam: 'Marruecos',
        homeFlag: 'br',
        awayFlag: 'ma',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-13T18:00:00.000Z',
        homeTeam: 'Haití',
        awayTeam: 'Escocia',
        homeFlag: 'ht',
        awayFlag: 'sco',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-17T23:00:00.000Z',
        homeTeam: 'Brasil',
        awayTeam: 'Haití',
        homeFlag: 'br',
        awayFlag: 'ht',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-18T02:00:00.000Z',
        homeTeam: 'Marruecos',
        awayTeam: 'Escocia',
        homeFlag: 'ma',
        awayFlag: 'sco',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-22T23:00:00.000Z',
        homeTeam: 'Brasil',
        awayTeam: 'Escocia',
        homeFlag: 'br',
        awayFlag: 'sco',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'C',
        date: '2026-06-22T23:00:00.000Z',
        homeTeam: 'Marruecos',
        awayTeam: 'Haití',
        homeFlag: 'ma',
        awayFlag: 'ht',
        stadium: 'TBD',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO D: Estados Unidos, Paraguay, Australia, UEFA Playoff C
    // =========================================================================
    {
        group: 'D',
        date: '2026-06-13T02:00:00.000Z',
        homeTeam: 'Estados Unidos',
        awayTeam: 'Paraguay',
        homeFlag: 'us',
        awayFlag: 'py',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-14T18:00:00.000Z',
        homeTeam: 'Australia',
        awayTeam: 'Finlandia', // Ficticio por UEFA Playoff C
        homeFlag: 'au',
        awayFlag: 'fi',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-18T18:00:00.000Z',
        homeTeam: 'Estados Unidos',
        awayTeam: 'Australia',
        homeFlag: 'us',
        awayFlag: 'au',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-18T21:00:00.000Z',
        homeTeam: 'Paraguay',
        awayTeam: 'Finlandia',
        homeFlag: 'py',
        awayFlag: 'fi',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-26T02:00:00.000Z', // 22:00 ET (25 Jun)
        homeTeam: 'Estados Unidos',
        awayTeam: 'Finlandia',
        homeFlag: 'us',
        awayFlag: 'fi',
        stadium: 'SoFi Stadium, Los Angeles',
        phase: 'GROUP',
    },
    {
        group: 'D',
        date: '2026-06-26T02:00:00.000Z', // 22:00 ET (25 Jun)
        homeTeam: 'Paraguay',
        awayTeam: 'Australia',
        homeFlag: 'py',
        awayFlag: 'au',
        stadium: 'Levi\'s Stadium, San Francisco Bay Area',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador
    // =========================================================================
    {
        group: 'E',
        date: '2026-06-14T21:00:00.000Z',
        homeTeam: 'Alemania',
        awayTeam: 'Curazao',
        homeFlag: 'de',
        awayFlag: 'cw',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-15T00:00:00.000Z',
        homeTeam: 'Costa de Marfil',
        awayTeam: 'Ecuador',
        homeFlag: 'ci',
        awayFlag: 'ec',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-19T18:00:00.000Z',
        homeTeam: 'Alemania',
        awayTeam: 'Costa de Marfil',
        homeFlag: 'de',
        awayFlag: 'ci',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'E',
        date: '2026-06-19T21:00:00.000Z',
        homeTeam: 'Curazao',
        awayTeam: 'Ecuador',
        homeFlag: 'cw',
        awayFlag: 'ec',
        stadium: 'TBD',
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
    // GRUPO F: Países Bajos, Japón, UEFA Playoff B, Túnez
    // =========================================================================
    {
        group: 'F',
        date: '2026-06-15T18:00:00.000Z',
        homeTeam: 'Países Bajos',
        awayTeam: 'Japón',
        homeFlag: 'nl',
        awayFlag: 'jp',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-15T21:00:00.000Z',
        homeTeam: 'Suecia', // Ficticio por UEFA Playoff B
        awayTeam: 'Túnez',
        homeFlag: 'se',
        awayFlag: 'tn',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-20T00:00:00.000Z',
        homeTeam: 'Países Bajos',
        awayTeam: 'Suecia',
        homeFlag: 'nl',
        awayFlag: 'se',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'F',
        date: '2026-06-20T03:00:00.000Z',
        homeTeam: 'Japón',
        awayTeam: 'Túnez',
        homeFlag: 'jp',
        awayFlag: 'tn',
        stadium: 'TBD',
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
    // GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda
    // =========================================================================
    {
        group: 'G',
        date: '2026-06-16T00:00:00.000Z',
        homeTeam: 'Bélgica',
        awayTeam: 'Egipto',
        homeFlag: 'be',
        awayFlag: 'eg',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-16T03:00:00.000Z',
        homeTeam: 'Irán',
        awayTeam: 'Nueva Zelanda',
        homeFlag: 'ir',
        awayFlag: 'nz',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-20T18:00:00.000Z',
        homeTeam: 'Bélgica',
        awayTeam: 'Irán',
        homeFlag: 'be',
        awayFlag: 'ir',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-20T21:00:00.000Z',
        homeTeam: 'Egipto',
        awayTeam: 'Nueva Zelanda',
        homeFlag: 'eg',
        awayFlag: 'nz',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-27T03:00:00.000Z', // 23:00 ET (26 Jun)
        homeTeam: 'Bélgica',
        awayTeam: 'Nueva Zelanda',
        homeFlag: 'be',
        awayFlag: 'nz',
        stadium: 'BC Place, Vancouver',
        phase: 'GROUP',
    },
    {
        group: 'G',
        date: '2026-06-27T03:00:00.000Z', // 23:00 ET (26 Jun)
        homeTeam: 'Egipto',
        awayTeam: 'Irán',
        homeFlag: 'eg',
        awayFlag: 'ir',
        stadium: 'Lumen Field, Seattle',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay
    // =========================================================================
    {
        group: 'H',
        date: '2026-06-14T00:00:00.000Z',
        homeTeam: 'España',
        awayTeam: 'Cabo Verde',
        homeFlag: 'es',
        awayFlag: 'cv',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-14T03:00:00.000Z',
        homeTeam: 'Arabia Saudí', // Normalizar nombre
        awayTeam: 'Uruguay',
        homeFlag: 'sa',
        awayFlag: 'uy',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-19T00:00:00.000Z',
        homeTeam: 'España',
        awayTeam: 'Arabia Saudí',
        homeFlag: 'es',
        awayFlag: 'sa',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-19T03:00:00.000Z',
        homeTeam: 'Cabo Verde',
        awayTeam: 'Uruguay',
        homeFlag: 'cv',
        awayFlag: 'uy',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-27T00:00:00.000Z', // 20:00 ET (26 Jun)
        homeTeam: 'España',
        awayTeam: 'Uruguay',
        homeFlag: 'es',
        awayFlag: 'uy',
        stadium: 'Estadio Akron, Guadalajara',
        phase: 'GROUP',
    },
    {
        group: 'H',
        date: '2026-06-27T00:00:00.000Z', // 20:00 ET (26 Jun)
        homeTeam: 'Cabo Verde',
        awayTeam: 'Arabia Saudí',
        homeFlag: 'cv',
        awayFlag: 'sa',
        stadium: 'NRG Stadium, Houston',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO I: Francia, Senegal, Playoff 2, Noruega
    // =========================================================================
    {
        group: 'I',
        date: '2026-06-13T23:00:00.000Z',
        homeTeam: 'Francia',
        awayTeam: 'Senegal',
        homeFlag: 'fr',
        awayFlag: 'sn',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-14T02:00:00.000Z',
        homeTeam: 'Bolivia', // Ficticio por Playoff 2
        awayTeam: 'Noruega',
        homeFlag: 'bo',
        awayFlag: 'no',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-18T23:00:00.000Z',
        homeTeam: 'Francia',
        awayTeam: 'Bolivia',
        homeFlag: 'fr',
        awayFlag: 'bo',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'I',
        date: '2026-06-19T02:00:00.000Z',
        homeTeam: 'Senegal',
        awayTeam: 'Noruega',
        homeFlag: 'sn',
        awayFlag: 'no',
        stadium: 'TBD',
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
    // GRUPO J: Argentina, Argelia, Austria, Jordania
    // =========================================================================
    {
        group: 'J',
        date: '2026-06-15T02:00:00.000Z',
        homeTeam: 'Argentina',
        awayTeam: 'Argelia',
        homeFlag: 'ar',
        awayFlag: 'dz',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-15T23:00:00.000Z',
        homeTeam: 'Austria',
        awayTeam: 'Jordania',
        homeFlag: 'at',
        awayFlag: 'jo',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-20T02:00:00.000Z',
        homeTeam: 'Argentina',
        awayTeam: 'Austria',
        homeFlag: 'ar',
        awayFlag: 'at',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-20T23:00:00.000Z',
        homeTeam: 'Argelia',
        awayTeam: 'Jordania',
        homeFlag: 'dz',
        awayFlag: 'jo',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-28T02:00:00.000Z', // 22:00 ET (27 Jun)
        homeTeam: 'Argentina',
        awayTeam: 'Jordania',
        homeFlag: 'ar',
        awayFlag: 'jo',
        stadium: 'AT&T Stadium, Dallas',
        phase: 'GROUP',
    },
    {
        group: 'J',
        date: '2026-06-28T02:00:00.000Z', // 22:00 ET (27 Jun)
        homeTeam: 'Argelia',
        awayTeam: 'Austria',
        homeFlag: 'dz',
        awayFlag: 'at',
        stadium: 'Arrowhead Stadium, Kansas City',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO K: Portugal, Playoff 1, Uzbekistán, Colombia
    // =========================================================================
    {
        group: 'K',
        date: '2026-06-16T02:00:00.000Z',
        homeTeam: 'Portugal',
        awayTeam: 'Honduras', // Ficticio por Playoff 1
        homeFlag: 'pt',
        awayFlag: 'hn',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-16T18:00:00.000Z',
        homeTeam: 'Uzbekistán',
        awayTeam: 'Colombia',
        homeFlag: 'uz',
        awayFlag: 'co',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-21T02:00:00.000Z',
        homeTeam: 'Portugal',
        awayTeam: 'Uzbekistán',
        homeFlag: 'pt',
        awayFlag: 'uz',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'K',
        date: '2026-06-21T18:00:00.000Z',
        homeTeam: 'Honduras',
        awayTeam: 'Colombia',
        homeFlag: 'hn',
        awayFlag: 'co',
        stadium: 'TBD',
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
        homeTeam: 'Honduras',
        awayTeam: 'Uzbekistán',
        homeFlag: 'hn',
        awayFlag: 'uz',
        stadium: 'Mercedes-Benz Stadium, Atlanta',
        phase: 'GROUP',
    },

    // =========================================================================
    // GRUPO L: Inglaterra, Croacia, Ghana, Panamá
    // =========================================================================
    {
        group: 'L',
        date: '2026-06-12T20:00:00.000Z',
        homeTeam: 'Inglaterra',
        awayTeam: 'Croacia',
        homeFlag: 'gb-eng',
        awayFlag: 'hr',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-13T20:00:00.000Z',
        homeTeam: 'Ghana',
        awayTeam: 'Panamá',
        homeFlag: 'gh',
        awayFlag: 'pa',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-17T20:00:00.000Z',
        homeTeam: 'Inglaterra',
        awayTeam: 'Ghana',
        homeFlag: 'gb-eng',
        awayFlag: 'gh',
        stadium: 'TBD',
        phase: 'GROUP',
    },
    {
        group: 'L',
        date: '2026-06-18T20:00:00.000Z',
        homeTeam: 'Croacia',
        awayTeam: 'Panamá',
        homeFlag: 'hr',
        awayFlag: 'pa',
        stadium: 'TBD',
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
