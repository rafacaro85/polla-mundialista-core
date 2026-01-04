import { AppDataSource } from '../../data-source';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const matchesData = [
    // --- GRUPO A ---
    { group: 'A', date: '2026-06-11 19:00:00', home_team: 'México', away_team: 'Sudáfrica', home_flag: 'mx', away_flag: 'za', stadium: 'Estadio Azteca, CDMX', phase: 'GROUP' },
    { group: 'A', date: '2026-06-12 02:00:00', home_team: 'Corea Sur', away_team: 'Grecia', home_flag: 'kr', away_flag: 'gr', stadium: 'Estadio Guadalajara', phase: 'GROUP' },
    { group: 'A', date: '2026-06-18 16:00:00', home_team: 'Grecia', away_team: 'Sudáfrica', home_flag: 'gr', away_flag: 'za', stadium: 'Estadio Atlanta', phase: 'GROUP' },
    { group: 'A', date: '2026-06-19 01:00:00', home_team: 'México', away_team: 'Corea Sur', home_flag: 'mx', away_flag: 'kr', stadium: 'Estadio Guadalajara', phase: 'GROUP' },
    { group: 'A', date: '2026-06-25 01:00:00', home_team: 'Grecia', away_team: 'México', home_flag: 'gr', away_flag: 'mx', stadium: 'Estadio Azteca, CDMX', phase: 'GROUP' },
    { group: 'A', date: '2026-06-25 01:00:00', home_team: 'Sudáfrica', away_team: 'Corea Sur', home_flag: 'za', away_flag: 'kr', stadium: 'Estadio Monterrey', phase: 'GROUP' },

    // --- GRUPO B ---
    { group: 'B', date: '2026-06-12 19:00:00', home_team: 'Canadá', away_team: 'Italia', home_flag: 'ca', away_flag: 'it', stadium: 'Estadio Toronto', phase: 'GROUP' },
    { group: 'B', date: '2026-06-13 19:00:00', home_team: 'Catar', away_team: 'Suiza', home_flag: 'qa', away_flag: 'ch', stadium: 'Estadio Bahía SF', phase: 'GROUP' },
    { group: 'B', date: '2026-06-18 19:00:00', home_team: 'Suiza', away_team: 'Italia', home_flag: 'ch', away_flag: 'it', stadium: 'Estadio Los Ángeles', phase: 'GROUP' },
    { group: 'B', date: '2026-06-18 22:00:00', home_team: 'Canadá', away_team: 'Catar', home_flag: 'ca', away_flag: 'qa', stadium: 'Estadio Vancouver', phase: 'GROUP' },
    { group: 'B', date: '2026-06-24 19:00:00', home_team: 'Suiza', away_team: 'Canadá', home_flag: 'ch', away_flag: 'ca', stadium: 'Estadio Vancouver', phase: 'GROUP' },
    { group: 'B', date: '2026-06-24 19:00:00', home_team: 'Italia', away_team: 'Catar', home_flag: 'it', away_flag: 'qa', stadium: 'Estadio Seattle', phase: 'GROUP' },

    // --- GRUPO C ---
    { group: 'C', date: '2026-06-13 22:00:00', home_team: 'Brasil', away_team: 'Marruecos', home_flag: 'br', away_flag: 'ma', stadium: 'Estadio NY/NJ', phase: 'GROUP' },
    { group: 'C', date: '2026-06-14 01:00:00', home_team: 'Haití', away_team: 'Escocia', home_flag: 'ht', away_flag: 'gb-sct', stadium: 'Estadio Boston', phase: 'GROUP' },
    { group: 'C', date: '2026-06-19 22:00:00', home_team: 'Escocia', away_team: 'Marruecos', home_flag: 'gb-sct', away_flag: 'ma', stadium: 'Estadio Boston', phase: 'GROUP' },
    { group: 'C', date: '2026-06-20 01:00:00', home_team: 'Brasil', away_team: 'Haití', home_flag: 'br', away_flag: 'ht', stadium: 'Estadio Filadelfia', phase: 'GROUP' },
    { group: 'C', date: '2026-06-24 22:00:00', home_team: 'Brasil', away_team: 'Escocia', home_flag: 'br', away_flag: 'gb-sct', stadium: 'Estadio Miami', phase: 'GROUP' },
    { group: 'C', date: '2026-06-24 22:00:00', home_team: 'Marruecos', away_team: 'Haití', home_flag: 'ma', away_flag: 'ht', stadium: 'Estadio Atlanta', phase: 'GROUP' },

    // --- GRUPO D ---
    { group: 'D', date: '2026-06-13 01:00:00', home_team: 'Estados Unidos', away_team: 'Paraguay', home_flag: 'us', away_flag: 'py', stadium: 'Estadio Los Ángeles', phase: 'GROUP' },
    { group: 'D', date: '2026-06-14 04:00:00', home_team: 'Australia', away_team: 'Finlandia', home_flag: 'au', away_flag: 'fi', stadium: 'Estadio Vancouver', phase: 'GROUP' },
    { group: 'D', date: '2026-06-19 19:00:00', home_team: 'Estados Unidos', away_team: 'Australia', home_flag: 'us', away_flag: 'au', stadium: 'Estadio Seattle', phase: 'GROUP' },
    { group: 'D', date: '2026-06-20 04:00:00', home_team: 'Finlandia', away_team: 'Paraguay', home_flag: 'fi', away_flag: 'py', stadium: 'Estadio Bahía SF', phase: 'GROUP' },
    { group: 'D', date: '2026-06-26 02:00:00', home_team: 'Finlandia', away_team: 'Estados Unidos', home_flag: 'fi', away_flag: 'us', stadium: 'Estadio Los Ángeles', phase: 'GROUP' },
    { group: 'D', date: '2026-06-26 02:00:00', home_team: 'Paraguay', away_team: 'Australia', home_flag: 'py', away_flag: 'au', stadium: 'Estadio Bahía SF', phase: 'GROUP' },

    // --- RESTO DE GRUPOS (E a L) ---
    { group: 'E', date: '2026-06-14 17:00:00', home_team: 'Alemania', away_team: 'Curazao', home_flag: 'de', away_flag: 'cw', stadium: 'Estadio Houston', phase: 'GROUP' },
    { group: 'E', date: '2026-06-14 23:00:00', home_team: 'Costa Marfil', away_team: 'Ecuador', home_flag: 'ci', away_flag: 'ec', stadium: 'Estadio Filadelfia', phase: 'GROUP' },
    { group: 'E', date: '2026-06-20 20:00:00', home_team: 'Alemania', away_team: 'Costa Marfil', home_flag: 'de', away_flag: 'ci', stadium: 'Estadio Toronto', phase: 'GROUP' },
    { group: 'E', date: '2026-06-21 02:00:00', home_team: 'Ecuador', away_team: 'Curazao', home_flag: 'ec', away_flag: 'cw', stadium: 'Estadio Kansas City', phase: 'GROUP' },
    { group: 'E', date: '2026-06-25 20:00:00', home_team: 'Curazao', away_team: 'Costa Marfil', home_flag: 'cw', away_flag: 'ci', stadium: 'Estadio Filadelfia', phase: 'GROUP' },
    { group: 'E', date: '2026-06-25 20:00:00', home_team: 'Ecuador', away_team: 'Alemania', home_flag: 'ec', away_flag: 'de', stadium: 'Estadio NY/NJ', phase: 'GROUP' },

    { group: 'F', date: '2026-06-14 20:00:00', home_team: 'Países Bajos', away_team: 'Japón', home_flag: 'nl', away_flag: 'jp', stadium: 'Estadio Dallas', phase: 'GROUP' },
    { group: 'F', date: '2026-06-15 02:00:00', home_team: 'Suecia', away_team: 'Túnez', home_flag: 'se', away_flag: 'tn', stadium: 'Estadio Monterrey', phase: 'GROUP' },
    { group: 'F', date: '2026-06-20 17:00:00', home_team: 'Países Bajos', away_team: 'Suecia', home_flag: 'nl', away_flag: 'se', stadium: 'Estadio Houston', phase: 'GROUP' },
    { group: 'F', date: '2026-06-21 04:00:00', home_team: 'Túnez', away_team: 'Japón', home_flag: 'tn', away_flag: 'jp', stadium: 'Estadio Monterrey', phase: 'GROUP' },
    { group: 'F', date: '2026-06-25 23:00:00', home_team: 'Japón', away_team: 'Suecia', home_flag: 'jp', away_flag: 'se', stadium: 'Estadio Dallas', phase: 'GROUP' },
    { group: 'F', date: '2026-06-25 23:00:00', home_team: 'Túnez', away_team: 'Países Bajos', home_flag: 'tn', away_flag: 'nl', stadium: 'Estadio Kansas City', phase: 'GROUP' },

    { group: 'G', date: '2026-06-15 19:00:00', home_team: 'Bélgica', away_team: 'Egipto', home_flag: 'be', away_flag: 'eg', stadium: 'Estadio Seattle', phase: 'GROUP' },
    { group: 'G', date: '2026-06-16 01:00:00', home_team: 'Irán', away_team: 'N. Zelanda', home_flag: 'ir', away_flag: 'nz', stadium: 'Estadio Los Ángeles', phase: 'GROUP' },
    { group: 'G', date: '2026-06-21 19:00:00', home_team: 'Bélgica', away_team: 'Irán', home_flag: 'be', away_flag: 'ir', stadium: 'Estadio Los Ángeles', phase: 'GROUP' },
    { group: 'G', date: '2026-06-22 01:00:00', home_team: 'N. Zelanda', away_team: 'Egipto', home_flag: 'nz', away_flag: 'eg', stadium: 'Estadio Vancouver', phase: 'GROUP' },
    { group: 'G', date: '2026-06-27 03:00:00', home_team: 'Egipto', away_team: 'Irán', home_flag: 'eg', away_flag: 'ir', stadium: 'Estadio Seattle', phase: 'GROUP' },
    { group: 'G', date: '2026-06-27 03:00:00', home_team: 'N. Zelanda', away_team: 'Bélgica', home_flag: 'nz', away_flag: 'be', stadium: 'Estadio Vancouver', phase: 'GROUP' },

    { group: 'H', date: '2026-06-15 16:00:00', home_team: 'España', away_team: 'Cabo Verde', home_flag: 'es', away_flag: 'cv', stadium: 'Estadio Atlanta', phase: 'GROUP' },
    { group: 'H', date: '2026-06-15 22:00:00', home_team: 'Arabia Saudí', away_team: 'Uruguay', home_flag: 'sa', away_flag: 'uy', stadium: 'Estadio Miami', phase: 'GROUP' },
    { group: 'H', date: '2026-06-21 16:00:00', home_team: 'España', away_team: 'Arabia Saudí', home_flag: 'es', away_flag: 'sa', stadium: 'Estadio Atlanta', phase: 'GROUP' },
    { group: 'H', date: '2026-06-21 22:00:00', home_team: 'Uruguay', away_team: 'Cabo Verde', home_flag: 'uy', away_flag: 'cv', stadium: 'Estadio Miami', phase: 'GROUP' },
    { group: 'H', date: '2026-06-27 00:00:00', home_team: 'Cabo Verde', away_team: 'Arabia Saudí', home_flag: 'cv', away_flag: 'sa', stadium: 'Estadio Houston', phase: 'GROUP' },
    { group: 'H', date: '2026-06-27 00:00:00', home_team: 'Uruguay', away_team: 'España', home_flag: 'uy', away_flag: 'es', stadium: 'Estadio Guadalajara', phase: 'GROUP' },

    { group: 'I', date: '2026-06-16 19:00:00', home_team: 'Francia', away_team: 'Senegal', home_flag: 'fr', away_flag: 'sn', stadium: 'Estadio NY/NJ', phase: 'GROUP' },
    { group: 'I', date: '2026-06-16 22:00:00', home_team: 'Bolivia', away_team: 'Noruega', home_flag: 'bo', away_flag: 'no', stadium: 'Estadio Boston', phase: 'GROUP' },
    { group: 'I', date: '2026-06-22 21:00:00', home_team: 'Francia', away_team: 'Bolivia', home_flag: 'fr', away_flag: 'bo', stadium: 'Estadio Filadelfia', phase: 'GROUP' },
    { group: 'I', date: '2026-06-23 00:00:00', home_team: 'Noruega', away_team: 'Senegal', home_flag: 'no', away_flag: 'sn', stadium: 'Estadio NY/NJ', phase: 'GROUP' },
    { group: 'I', date: '2026-06-26 19:00:00', home_team: 'Noruega', away_team: 'Francia', home_flag: 'no', away_flag: 'fr', stadium: 'Estadio Boston', phase: 'GROUP' },
    { group: 'I', date: '2026-06-26 19:00:00', home_team: 'Senegal', away_team: 'Bolivia', home_flag: 'sn', away_flag: 'bo', stadium: 'Estadio Toronto', phase: 'GROUP' },

    { group: 'J', date: '2026-06-17 01:00:00', home_team: 'Argentina', away_team: 'Argelia', home_flag: 'ar', away_flag: 'dz', stadium: 'Estadio Kansas City', phase: 'GROUP' },
    { group: 'J', date: '2026-06-17 04:00:00', home_team: 'Austria', away_team: 'Jordania', home_flag: 'at', away_flag: 'jo', stadium: 'Estadio Bahía SF', phase: 'GROUP' },
    { group: 'J', date: '2026-06-22 17:00:00', home_team: 'Argentina', away_team: 'Austria', home_flag: 'ar', away_flag: 'at', stadium: 'Estadio Dallas', phase: 'GROUP' },
    { group: 'J', date: '2026-06-23 03:00:00', home_team: 'Jordania', away_team: 'Argelia', home_flag: 'jo', away_flag: 'dz', stadium: 'Estadio Bahía SF', phase: 'GROUP' },
    { group: 'J', date: '2026-06-28 02:00:00', home_team: 'Argelia', away_team: 'Austria', home_flag: 'dz', away_flag: 'at', stadium: 'Estadio Kansas City', phase: 'GROUP' },
    { group: 'J', date: '2026-06-28 02:00:00', home_team: 'Jordania', away_team: 'Argentina', home_flag: 'jo', away_flag: 'ar', stadium: 'Estadio Dallas', phase: 'GROUP' },

    { group: 'K', date: '2026-06-17 17:00:00', home_team: 'Portugal', away_team: 'Repechaje K', home_flag: 'pt', away_flag: 'un', stadium: 'Estadio Houston', phase: 'GROUP' },
    { group: 'K', date: '2026-06-18 02:00:00', home_team: 'Uzbekistán', away_team: 'Colombia', home_flag: 'uz', away_flag: 'co', stadium: 'Estadio Azteca, CDMX', phase: 'GROUP' },
    { group: 'K', date: '2026-06-23 17:00:00', home_team: 'Portugal', away_team: 'Uzbekistán', home_flag: 'pt', away_flag: 'uz', stadium: 'Estadio Houston', phase: 'GROUP' },
    { group: 'K', date: '2026-06-24 02:00:00', home_team: 'Colombia', away_team: 'Repechaje K', home_flag: 'co', away_flag: 'un', stadium: 'Estadio Guadalajara', phase: 'GROUP' },
    { group: 'K', date: '2026-06-27 23:30:00', home_team: 'Colombia', away_team: 'Portugal', home_flag: 'co', away_flag: 'pt', stadium: 'Estadio Miami', phase: 'GROUP' },
    { group: 'K', date: '2026-06-27 23:30:00', home_team: 'Repechaje K', away_team: 'Uzbekistán', home_flag: 'un', away_flag: 'uz', stadium: 'Estadio Atlanta', phase: 'GROUP' },

    { group: 'L', date: '2026-06-17 20:00:00', home_team: 'Inglaterra', away_team: 'Croacia', home_flag: 'gb-eng', away_flag: 'hr', stadium: 'Estadio Dallas', phase: 'GROUP' },
    { group: 'L', date: '2026-06-17 23:00:00', home_team: 'Ghana', away_team: 'Panamá', home_flag: 'gh', away_flag: 'pa', stadium: 'Estadio Toronto', phase: 'GROUP' },
    { group: 'L', date: '2026-06-23 20:00:00', home_team: 'Inglaterra', away_team: 'Ghana', home_flag: 'gb-eng', away_flag: 'gh', stadium: 'Estadio Boston', phase: 'GROUP' },
    { group: 'L', date: '2026-06-23 23:00:00', home_team: 'Panamá', away_team: 'Croacia', home_flag: 'pa', away_flag: 'hr', stadium: 'Estadio Toronto', phase: 'GROUP' },
    { group: 'L', date: '2026-06-27 21:00:00', home_team: 'Panamá', away_team: 'Inglaterra', home_flag: 'pa', away_flag: 'gb-eng', stadium: 'Estadio NY/NJ', phase: 'GROUP' },
    { group: 'L', date: '2026-06-27 21:00:00', home_team: 'Croacia', away_team: 'Ghana', home_flag: 'hr', away_flag: 'gh', stadium: 'Estadio Filadelfia', phase: 'GROUP' },

    // --- DIECISEISAVOS (ROUND_32) 28 JUN - 3 JUL ---
    { phase: 'ROUND_32', date: '2026-06-28 18:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Los Ángeles', bracket_id: 73, home_placeholder: '2A', away_placeholder: '2B' },
    { phase: 'ROUND_32', date: '2026-06-29 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Boston', bracket_id: 74, home_placeholder: '1E', away_placeholder: '3A/B/C/D/F' },
    { phase: 'ROUND_32', date: '2026-06-29 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Monterrey', bracket_id: 75, home_placeholder: '1F', away_placeholder: '2C' },
    { phase: 'ROUND_32', date: '2026-06-29 22:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Houston', bracket_id: 76, home_placeholder: '1E', away_placeholder: '2F' },
    { phase: 'ROUND_32', date: '2026-06-30 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio NY/NJ', bracket_id: 77, home_placeholder: '1I', away_placeholder: '3C/D/F/G/H' },
    { phase: 'ROUND_32', date: '2026-06-30 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Dallas', bracket_id: 78, home_placeholder: '2E', away_placeholder: '2I' },
    { phase: 'ROUND_32', date: '2026-06-30 22:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Cd México', bracket_id: 79, home_placeholder: '1A', away_placeholder: '3C/E/F/H/I' },
    { phase: 'ROUND_32', date: '2026-07-01 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Atlanta', bracket_id: 80, home_placeholder: '1L', away_placeholder: '3E/H/I/J/K' },
    { phase: 'ROUND_32', date: '2026-07-01 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Bahía SF', bracket_id: 81, home_placeholder: '1D', away_placeholder: '3B/E/F/I/J' },
    { phase: 'ROUND_32', date: '2026-07-01 22:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Seattle', bracket_id: 82, home_placeholder: '1G', away_placeholder: '3A/E/H/I/J' },
    { phase: 'ROUND_32', date: '2026-07-02 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Toronto', bracket_id: 83, home_placeholder: '2K', away_placeholder: '2L' },
    { phase: 'ROUND_32', date: '2026-07-02 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Los Ángeles', bracket_id: 84, home_placeholder: '1H', away_placeholder: '2J' },
    { phase: 'ROUND_32', date: '2026-07-02 22:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Vancouver', bracket_id: 85, home_placeholder: '1B', away_placeholder: '3E/F/G/I/J' },
    { phase: 'ROUND_32', date: '2026-07-03 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Miami', bracket_id: 86, home_placeholder: '1J', away_placeholder: '2H' },
    { phase: 'ROUND_32', date: '2026-07-03 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Kansas City', bracket_id: 87, home_placeholder: '1K', away_placeholder: '3D/E/I/J/L' },
    { phase: 'ROUND_32', date: '2026-07-03 22:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Dallas', bracket_id: 88, home_placeholder: '2D', away_placeholder: '2G' },

    // --- OCTAVOS ---
    { phase: 'ROUND_16', date: '2026-07-04 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Filadelfia', bracket_id: 89, home_placeholder: 'Ganador 74', away_placeholder: 'Ganador 77' },
    { phase: 'ROUND_16', date: '2026-07-04 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Houston', bracket_id: 90, home_placeholder: 'Ganador 73', away_placeholder: 'Ganador 75' },
    { phase: 'ROUND_16', date: '2026-07-05 17:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio NY/NJ', bracket_id: 91, home_placeholder: 'Ganador 76', away_placeholder: 'Ganador 78' },
    { phase: 'ROUND_16', date: '2026-07-05 20:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Cd México', bracket_id: 92, home_placeholder: 'Ganador 79', away_placeholder: 'Ganador 80' },
    { phase: 'ROUND_16', date: '2026-07-06 17:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Dallas', bracket_id: 93, home_placeholder: 'Ganador 83', away_placeholder: 'Ganador 84' },
    { phase: 'ROUND_16', date: '2026-07-06 20:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Seattle', bracket_id: 94, home_placeholder: 'Ganador 81', away_placeholder: 'Ganador 82' },
    { phase: 'ROUND_16', date: '2026-07-07 17:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Atlanta', bracket_id: 95, home_placeholder: 'Ganador 86', away_placeholder: 'Ganador 88' },
    { phase: 'ROUND_16', date: '2026-07-07 20:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Vancouver', bracket_id: 96, home_placeholder: 'Ganador 85', away_placeholder: 'Ganador 87' },

    // --- CUARTOS ---
    { phase: 'QUARTER', date: '2026-07-09 18:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Boston', bracket_id: 97, home_placeholder: 'Ganador 89', away_placeholder: 'Ganador 90' },
    { phase: 'QUARTER', date: '2026-07-10 18:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Los Ángeles', bracket_id: 98, home_placeholder: 'Ganador 93', away_placeholder: 'Ganador 94' },
    { phase: 'QUARTER', date: '2026-07-11 14:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Miami', bracket_id: 99, home_placeholder: 'Ganador 91', away_placeholder: 'Ganador 92' },
    { phase: 'QUARTER', date: '2026-07-11 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Kansas City', bracket_id: 100, home_placeholder: 'Ganador 95', away_placeholder: 'Ganador 96' },

    // --- SEMIS ---
    { phase: 'SEMI', date: '2026-07-14 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Dallas', bracket_id: 101, home_placeholder: 'Ganador 97', away_placeholder: 'Ganador 98' },
    { phase: 'SEMI', date: '2026-07-15 19:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Atlanta', bracket_id: 102, home_placeholder: 'Ganador 99', away_placeholder: 'Ganador 100' },

    // --- TERCER PUESTO ---
    { phase: '3RD_PLACE', date: '2026-07-18 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio Miami', bracket_id: 103, home_placeholder: 'Perdedor 101', away_placeholder: 'Perdedor 102' },

    // --- FINAL ---
    { phase: 'FINAL', date: '2026-07-19 16:00:00', home_team: '', away_team: '', home_flag: 'un', away_flag: 'un', stadium: 'Estadio NY/NJ', bracket_id: 104, home_placeholder: 'Ganador 101', away_placeholder: 'Ganador 102' },
];

async function main() {
    console.log('🌍 Iniciando carga masiva vía RAW SQL...');

    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'yamabiko.proxy.rlwy.net',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || 'railway',
        entities: [], // No necesitamos entidades para RAW SQL
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    try {
        await dataSource.initialize();

        console.log('🗑️ Limpiando tabla matches y phase status...');
        await dataSource.query('DELETE FROM matches');
        await dataSource.query('DELETE FROM knockout_phase_status');

        console.log('📅 Inicializando fases...');
        const phases = ['GROUP', 'ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];
        for (const phase of phases) {
            await dataSource.query(
                'INSERT INTO knockout_phase_status (phase, is_unlocked, all_matches_completed) VALUES ($1, $2, $3)',
                [phase, phase === 'GROUP', false]
            );
        }

        console.log(`📅 Insertando ${matchesData.length} partidos...`);

        for (const m of matchesData) {
            const query = `
                INSERT INTO matches (
                    "group", "date", "homeTeam", "awayTeam", "homeFlag", "awayFlag", 
                    "stadium", "phase", "status", "isLocked", "bracketId", 
                    "homeTeamPlaceholder", "awayTeamPlaceholder"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;

            const values = [
                m.group || '',
                new Date(m.date),
                m.home_team,
                m.away_team,
                m.home_flag,
                m.away_flag,
                m.stadium,
                m.phase,
                'PENDING',
                false,
                m.bracket_id || null,
                m.home_placeholder || null,
                m.away_placeholder || null
            ];

            await dataSource.query(query, values);
        }

        console.log('✅ ¡Calendario (104) cargado con éxito vía RAW SQL!');
    } catch (err) {
        console.error('❌ Error en RAW SQL:', err);
    } finally {
        await dataSource.destroy();
    }
}

main();
