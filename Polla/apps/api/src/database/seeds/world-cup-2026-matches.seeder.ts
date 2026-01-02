import { Match } from '../entities/match.entity';
import { AppDataSource } from '../../data-source';
import * as dotenv from 'dotenv';

dotenv.config();

interface MatchData {
    group?: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    stadium: string;
    phase: string;
    homeTeamPlaceholder?: string;
    awayTeamPlaceholder?: string;
    bracketId?: number;
}

const matchesData: MatchData[] = [
    // --- JUEVES 11 JUNIO ---
    { group: 'A', date: '2026-06-11T19:00:00.000Z', homeTeam: 'México', awayTeam: 'Sudáfrica', homeFlag: 'mx', awayFlag: 'za', stadium: 'Estadio Azteca, CDMX', phase: 'GROUP' },
    { group: 'A', date: '2026-06-12T02:00:00.000Z', homeTeam: 'Corea del Sur', awayTeam: 'Grecia', homeFlag: 'kr', awayFlag: 'gr', stadium: 'Estadio Guadalajara', phase: 'GROUP' }, // Grecia = Playoff UEFA D

    // --- VIERNES 12 JUNIO ---
    { group: 'B', date: '2026-06-12T19:00:00.000Z', homeTeam: 'Canadá', awayTeam: 'Italia', homeFlag: 'ca', awayFlag: 'it', stadium: 'Estadio Toronto (BMO Field)', phase: 'GROUP' }, // Italia = Playoff UEFA A
    { group: 'D', date: '2026-06-13T01:00:00.000Z', homeTeam: 'Estados Unidos', awayTeam: 'Paraguay', homeFlag: 'us', awayFlag: 'py', stadium: 'Estadio Los Ángeles (SoFi)', phase: 'GROUP' },

    // --- SÁBADO 13 JUNIO ---
    { group: 'B', date: '2026-06-13T19:00:00.000Z', homeTeam: 'Catar', awayTeam: 'Suiza', homeFlag: 'qa', awayFlag: 'ch', stadium: 'Estadio Bahía de San Francisco (Levi\'s)', phase: 'GROUP' },
    { group: 'C', date: '2026-06-13T22:00:00.000Z', homeTeam: 'Brasil', awayTeam: 'Marruecos', homeFlag: 'br', awayFlag: 'ma', stadium: 'Estadio NY/NJ (MetLife)', phase: 'GROUP' },
    { group: 'C', date: '2026-06-14T01:00:00.000Z', homeTeam: 'Haití', awayTeam: 'Escocia', homeFlag: 'ht', awayFlag: 'gb-sct', stadium: 'Estadio Boston (Gillette)', phase: 'GROUP' },
    { group: 'D', date: '2026-06-14T04:00:00.000Z', homeTeam: 'Australia', awayTeam: 'Finlandia', homeFlag: 'au', awayFlag: 'fi', stadium: 'Estadio BC Place Vancouver', phase: 'GROUP' }, // Finlandia = Playoff UEFA C

    // --- DOMINGO 14 JUNIO ---
    { group: 'E', date: '2026-06-14T17:00:00.000Z', homeTeam: 'Alemania', awayTeam: 'Curazao', homeFlag: 'de', awayFlag: 'cw', stadium: 'Estadio Houston (NRG)', phase: 'GROUP' },
    { group: 'F', date: '2026-06-14T20:00:00.000Z', homeTeam: 'Países Bajos', awayTeam: 'Japón', homeFlag: 'nl', awayFlag: 'jp', stadium: 'Estadio Dallas (AT&T)', phase: 'GROUP' },
    { group: 'E', date: '2026-06-14T23:00:00.000Z', homeTeam: 'Costa de Marfil', awayTeam: 'Ecuador', homeFlag: 'ci', awayFlag: 'ec', stadium: 'Estadio Filadelfia (Lincoln Financial)', phase: 'GROUP' },
    { group: 'F', date: '2026-06-15T02:00:00.000Z', homeTeam: 'Suecia', awayTeam: 'Túnez', homeFlag: 'se', awayFlag: 'tn', stadium: 'Estadio Monterrey (BBVA)', phase: 'GROUP' }, // Suecia = Playoff UEFA B

    // --- LUNES 15 JUNIO ---
    { group: 'H', date: '2026-06-15T16:00:00.000Z', homeTeam: 'España', awayTeam: 'Cabo Verde', homeFlag: 'es', awayFlag: 'cv', stadium: 'Estadio Atlanta (Mercedes-Benz)', phase: 'GROUP' },
    { group: 'G', date: '2026-06-15T19:00:00.000Z', homeTeam: 'Bélgica', awayTeam: 'Egipto', homeFlag: 'be', awayFlag: 'eg', stadium: 'Estadio Seattle (Lumen Field)', phase: 'GROUP' },
    { group: 'H', date: '2026-06-15T22:00:00.000Z', homeTeam: 'Arabia Saudí', awayTeam: 'Uruguay', homeFlag: 'sa', awayFlag: 'uy', stadium: 'Estadio Miami (Hard Rock)', phase: 'GROUP' },
    { group: 'G', date: '2026-06-16T01:00:00.000Z', homeTeam: 'Irán', awayTeam: 'Nueva Zelanda', homeFlag: 'ir', awayFlag: 'nz', stadium: 'Estadio Los Ángeles (SoFi)', phase: 'GROUP' },

    // --- MARTES 16 JUNIO ---
    { group: 'I', date: '2026-06-16T19:00:00.000Z', homeTeam: 'Francia', awayTeam: 'Senegal', homeFlag: 'fr', awayFlag: 'sn', stadium: 'Estadio NY/NJ (MetLife)', phase: 'GROUP' },
    { group: 'I', date: '2026-06-16T22:00:00.000Z', homeTeam: 'Bolivia', awayTeam: 'Noruega', homeFlag: 'bo', awayFlag: 'no', stadium: 'Estadio Boston (Gillette)', phase: 'GROUP' }, // Bolivia = Playoff 2
    { group: 'J', date: '2026-06-17T01:00:00.000Z', homeTeam: 'Argentina', awayTeam: 'Argelia', homeFlag: 'ar', awayFlag: 'dz', stadium: 'Estadio Kansas City (Arrowhead)', phase: 'GROUP' },
    { group: 'J', date: '2026-06-17T04:00:00.000Z', homeTeam: 'Austria', awayTeam: 'Jordania', homeFlag: 'at', awayFlag: 'jo', stadium: 'Estadio Bahía de San Francisco (Levi\'s)', phase: 'GROUP' },

    // --- MIÉRCOLES 17 JUNIO ---
    { group: 'K', date: '2026-06-17T17:00:00.000Z', homeTeam: 'Portugal', awayTeam: 'Repechaje K', homeFlag: 'pt', awayFlag: 'un', stadium: 'Estadio Houston (NRG)', phase: 'GROUP' }, // Repechaje K = Playoff 1
    { group: 'L', date: '2026-06-17T20:00:00.000Z', homeTeam: 'Inglaterra', awayTeam: 'Croacia', homeFlag: 'gb-eng', awayFlag: 'hr', stadium: 'Estadio Dallas (AT&T)', phase: 'GROUP' },
    { group: 'L', date: '2026-06-17T23:00:00.000Z', homeTeam: 'Ghana', awayTeam: 'Panamá', homeFlag: 'gh', awayFlag: 'pa', stadium: 'Estadio Toronto (BMO Field)', phase: 'GROUP' },
    { group: 'K', date: '2026-06-18T02:00:00.000Z', homeTeam: 'Uzbekistán', awayTeam: 'Colombia', homeFlag: 'uz', awayFlag: 'co', stadium: 'Estadio Azteca, Ciudad de México', phase: 'GROUP' },

    // --- JUEVES 18 JUNIO ---
    { group: 'A', date: '2026-06-18T16:00:00.000Z', homeTeam: 'Grecia', awayTeam: 'Sudáfrica', homeFlag: 'gr', awayFlag: 'za', stadium: 'Estadio Atlanta (Mercedes-Benz)', phase: 'GROUP' },
    { group: 'B', date: '2026-06-18T19:00:00.000Z', homeTeam: 'Suiza', awayTeam: 'Italia', homeFlag: 'ch', awayFlag: 'it', stadium: 'Estadio Los Ángeles (SoFi)', phase: 'GROUP' },
    { group: 'B', date: '2026-06-18T22:00:00.000Z', homeTeam: 'Canadá', awayTeam: 'Catar', homeFlag: 'ca', awayFlag: 'qa', stadium: 'Estadio BC Place Vancouver', phase: 'GROUP' },
    { group: 'A', date: '2026-06-19T01:00:00.000Z', homeTeam: 'México', awayTeam: 'Corea del Sur', homeFlag: 'mx', awayFlag: 'kr', stadium: 'Estadio Guadalajara', phase: 'GROUP' },

    // --- VIERNES 19 JUNIO ---
    { group: 'D', date: '2026-06-19T19:00:00.000Z', homeTeam: 'Estados Unidos', awayTeam: 'Australia', homeFlag: 'us', awayFlag: 'au', stadium: 'Estadio Seattle (Lumen Field)', phase: 'GROUP' },
    { group: 'C', date: '2026-06-19T22:00:00.000Z', homeTeam: 'Escocia', awayTeam: 'Marruecos', homeFlag: 'gb-sct', awayFlag: 'ma', stadium: 'Estadio Boston (Gillette)', phase: 'GROUP' },
    { group: 'C', date: '2026-06-20T01:00:00.000Z', homeTeam: 'Brasil', awayTeam: 'Haití', homeFlag: 'br', awayFlag: 'ht', stadium: 'Estadio Filadelfia (Lincoln Financial)', phase: 'GROUP' },
    { group: 'D', date: '2026-06-20T04:00:00.000Z', homeTeam: 'Finlandia', awayTeam: 'Paraguay', homeFlag: 'fi', awayFlag: 'py', stadium: 'Estadio Bahía de San Francisco (Levi\'s)', phase: 'GROUP' },

    // --- SÁBADO 20 JUNIO ---
    { group: 'F', date: '2026-06-20T17:00:00.000Z', homeTeam: 'Países Bajos', awayTeam: 'Suecia', homeFlag: 'nl', awayFlag: 'se', stadium: 'Estadio Houston (NRG)', phase: 'GROUP' },
    { group: 'E', date: '2026-06-20T20:00:00.000Z', homeTeam: 'Alemania', awayTeam: 'Costa de Marfil', homeFlag: 'de', awayFlag: 'ci', stadium: 'Estadio Toronto (BMO Field)', phase: 'GROUP' },
    { group: 'E', date: '2026-06-21T02:00:00.000Z', homeTeam: 'Ecuador', awayTeam: 'Curazao', homeFlag: 'ec', awayFlag: 'cw', stadium: 'Estadio Kansas City (Arrowhead)', phase: 'GROUP' },
    { group: 'F', date: '2026-06-21T04:00:00.000Z', homeTeam: 'Túnez', awayTeam: 'Japón', homeFlag: 'tn', awayFlag: 'jp', stadium: 'Estadio Monterrey (BBVA)', phase: 'GROUP' },

    // --- DOMINGO 21 JUNIO ---
    { group: 'H', date: '2026-06-21T16:00:00.000Z', homeTeam: 'España', awayTeam: 'Arabia Saudí', homeFlag: 'es', awayFlag: 'sa', stadium: 'Estadio Atlanta (Mercedes-Benz)', phase: 'GROUP' },
    { group: 'G', date: '2026-06-21T19:00:00.000Z', homeTeam: 'Bélgica', awayTeam: 'Irán', homeFlag: 'be', awayFlag: 'ir', stadium: 'Estadio Los Ángeles (SoFi)', phase: 'GROUP' },
    { group: 'H', date: '2026-06-21T22:00:00.000Z', homeTeam: 'Uruguay', awayTeam: 'Cabo Verde', homeFlag: 'uy', awayFlag: 'cv', stadium: 'Estadio Miami (Hard Rock)', phase: 'GROUP' },
    { group: 'G', date: '2026-06-22T01:00:00.000Z', homeTeam: 'Nueva Zelanda', awayTeam: 'Egipto', homeFlag: 'nz', awayFlag: 'eg', stadium: 'Estadio BC Place Vancouver', phase: 'GROUP' },

    // --- LUNES 22 JUNIO ---
    { group: 'J', date: '2026-06-22T17:00:00.000Z', homeTeam: 'Argentina', awayTeam: 'Austria', homeFlag: 'ar', awayFlag: 'at', stadium: 'Estadio Dallas (AT&T)', phase: 'GROUP' },
    { group: 'I', date: '2026-06-22T21:00:00.000Z', homeTeam: 'Francia', awayTeam: 'Bolivia', homeFlag: 'fr', awayFlag: 'bo', stadium: 'Estadio Filadelfia (Lincoln Financial)', phase: 'GROUP' },
    { group: 'I', date: '2026-06-23T00:00:00.000Z', homeTeam: 'Noruega', awayTeam: 'Senegal', homeFlag: 'no', awayFlag: 'sn', stadium: 'Estadio NY/NJ (MetLife)', phase: 'GROUP' },
    { group: 'J', date: '2026-06-23T03:00:00.000Z', homeTeam: 'Jordania', awayTeam: 'Argelia', homeFlag: 'jo', awayFlag: 'dz', stadium: 'Estadio Bahía de San Francisco (Levi\'s)', phase: 'GROUP' },

    // --- MARTES 23 JUNIO ---
    { group: 'K', date: '2026-06-23T17:00:00.000Z', homeTeam: 'Portugal', awayTeam: 'Uzbekistán', homeFlag: 'pt', awayFlag: 'uz', stadium: 'Estadio Houston (NRG)', phase: 'GROUP' },
    { group: 'L', date: '2026-06-23T20:00:00.000Z', homeTeam: 'Inglaterra', awayTeam: 'Ghana', homeFlag: 'gb-eng', awayFlag: 'gh', stadium: 'Estadio Boston (Gillette)', phase: 'GROUP' },
    { group: 'L', date: '2026-06-23T23:00:00.000Z', homeTeam: 'Panamá', awayTeam: 'Croacia', homeFlag: 'pa', awayFlag: 'hr', stadium: 'Estadio Toronto (BMO Field)', phase: 'GROUP' },
    { group: 'K', date: '2026-06-24T02:00:00.000Z', homeTeam: 'Colombia', awayTeam: 'Repechaje K', homeFlag: 'co', awayFlag: 'un', stadium: 'Estadio Guadalajara', phase: 'GROUP' },

    // --- MIÉRCOLES 24 JUNIO ---
    { group: 'B', date: '2026-06-24T19:00:00.000Z', homeTeam: 'Suiza', awayTeam: 'Canadá', homeFlag: 'ch', awayFlag: 'ca', stadium: 'Estadio BC Place Vancouver', phase: 'GROUP' },
    { group: 'B', date: '2026-06-24T19:00:00.000Z', homeTeam: 'Italia', awayTeam: 'Catar', homeFlag: 'it', awayFlag: 'qa', stadium: 'Estadio Seattle (Lumen Field)', phase: 'GROUP' },
    { group: 'C', date: '2026-06-24T22:00:00.000Z', homeTeam: 'Brasil', awayTeam: 'Escocia', homeFlag: 'br', awayFlag: 'gb-sct', stadium: 'Estadio Miami (Hard Rock)', phase: 'GROUP' },
    { group: 'C', date: '2026-06-24T22:00:00.000Z', homeTeam: 'Marruecos', awayTeam: 'Haití', homeFlag: 'ma', awayFlag: 'ht', stadium: 'Estadio Atlanta (Mercedes-Benz)', phase: 'GROUP' },
    { group: 'A', date: '2026-06-25T01:00:00.000Z', homeTeam: 'Grecia', awayTeam: 'México', homeFlag: 'gr', awayFlag: 'mx', stadium: 'Estadio Azteca, CDMX', phase: 'GROUP' },
    { group: 'A', date: '2026-06-25T01:00:00.000Z', homeTeam: 'Sudáfrica', awayTeam: 'Corea del Sur', homeFlag: 'za', awayFlag: 'kr', stadium: 'Estadio Monterrey (BBVA)', phase: 'GROUP' },

    // --- JUEVES 25 JUNIO ---
    { group: 'E', date: '2026-06-25T20:00:00.000Z', homeTeam: 'Curazao', awayTeam: 'Costa de Marfil', homeFlag: 'cw', awayFlag: 'ci', stadium: 'Estadio Filadelfia (Lincoln Financial)', phase: 'GROUP' },
    { group: 'E', date: '2026-06-25T20:00:00.000Z', homeTeam: 'Ecuador', awayTeam: 'Alemania', homeFlag: 'ec', awayFlag: 'de', stadium: 'Estadio NY/NJ (MetLife)', phase: 'GROUP' },
    { group: 'F', date: '2026-06-25T23:00:00.000Z', homeTeam: 'Japón', awayTeam: 'Suecia', homeFlag: 'jp', awayFlag: 'se', stadium: 'Estadio Dallas (AT&T)', phase: 'GROUP' },
    { group: 'F', date: '2026-06-25T23:00:00.000Z', homeTeam: 'Túnez', awayTeam: 'Países Bajos', homeFlag: 'tn', awayFlag: 'nl', stadium: 'Estadio Kansas City (Arrowhead)', phase: 'GROUP' },
    { group: 'D', date: '2026-06-26T02:00:00.000Z', homeTeam: 'Finlandia', awayTeam: 'Estados Unidos', homeFlag: 'fi', awayFlag: 'us', stadium: 'Estadio Los Ángeles (SoFi)', phase: 'GROUP' },
    { group: 'D', date: '2026-06-26T02:00:00.000Z', homeTeam: 'Paraguay', awayTeam: 'Australia', homeFlag: 'py', awayFlag: 'au', stadium: 'Estadio Bahía de San Francisco (Levi\'s)', phase: 'GROUP' },

    // --- VIERNES 26 JUNIO ---
    { group: 'I', date: '2026-06-26T19:00:00.000Z', homeTeam: 'Noruega', awayTeam: 'Francia', homeFlag: 'no', awayFlag: 'fr', stadium: 'Estadio Boston (Gillette)', phase: 'GROUP' },
    { group: 'I', date: '2026-06-26T19:00:00.000Z', homeTeam: 'Senegal', awayTeam: 'Bolivia', homeFlag: 'sn', awayFlag: 'bo', stadium: 'Estadio Toronto (BMO Field)', phase: 'GROUP' },
    { group: 'H', date: '2026-06-27T00:00:00.000Z', homeTeam: 'Cabo Verde', awayTeam: 'Arabia Saudí', homeFlag: 'cv', awayFlag: 'sa', stadium: 'Estadio Houston (NRG)', phase: 'GROUP' },
    { group: 'H', date: '2026-06-27T00:00:00.000Z', homeTeam: 'Uruguay', awayTeam: 'España', homeFlag: 'uy', awayFlag: 'es', stadium: 'Estadio Guadalajara', phase: 'GROUP' },
    { group: 'G', date: '2026-06-27T03:00:00.000Z', homeTeam: 'Egipto', awayTeam: 'Irán', homeFlag: 'eg', awayFlag: 'ir', stadium: 'Estadio Seattle (Lumen Field)', phase: 'GROUP' },
    { group: 'G', date: '2026-06-27T03:00:00.000Z', homeTeam: 'Nueva Zelanda', awayTeam: 'Bélgica', homeFlag: 'nz', awayFlag: 'be', stadium: 'Estadio BC Place Vancouver', phase: 'GROUP' },

    // --- SÁBADO 27 JUNIO ---
    { group: 'L', date: '2026-06-27T21:00:00.000Z', homeTeam: 'Panamá', awayTeam: 'Inglaterra', homeFlag: 'pa', awayFlag: 'gb-eng', stadium: 'Estadio NY/NJ (MetLife)', phase: 'GROUP' },
    { group: 'L', date: '2026-06-27T21:00:00.000Z', homeTeam: 'Croacia', awayTeam: 'Ghana', homeFlag: 'hr', awayFlag: 'gh', stadium: 'Estadio Filadelfia (Lincoln Financial)', phase: 'GROUP' },
    { group: 'K', date: '2026-06-27T23:30:00.000Z', homeTeam: 'Colombia', awayTeam: 'Portugal', homeFlag: 'co', awayFlag: 'pt', stadium: 'Estadio Miami (Hard Rock)', phase: 'GROUP' },
    { group: 'K', date: '2026-06-27T23:30:00.000Z', homeTeam: 'Repechaje K', awayTeam: 'Uzbekistán', homeFlag: 'un', awayFlag: 'uz', stadium: 'Estadio Atlanta (Mercedes-Benz)', phase: 'GROUP' },
    { group: 'J', date: '2026-06-28T02:00:00.000Z', homeTeam: 'Argelia', awayTeam: 'Austria', homeFlag: 'dz', awayFlag: 'at', stadium: 'Estadio Kansas City (Arrowhead)', phase: 'GROUP' },
    { group: 'J', date: '2026-06-28T02:00:00.000Z', homeTeam: 'Jordania', awayTeam: 'Argentina', homeFlag: 'jo', awayFlag: 'ar', stadium: 'Estadio Dallas (AT&T)', phase: 'GROUP' },

    // --- DIECISEISAVOS DE FINAL ---
    { phase: 'ROUND_32', date: '2026-06-28T18:00:00.000Z', homeTeam: '2A', awayTeam: '2B', homeFlag: 'un', awayFlag: 'un', stadium: 'Estadio Los Ángeles (SoFi)', homeTeamPlaceholder: '2A', awayTeamPlaceholder: '2B', bracketId: 1 },
    { phase: 'ROUND_32', date: '2026-06-29T16:00:00.000Z', homeTeam: '1E', awayTeam: '3A/B/C/D/F', homeFlag: 'un', awayFlag: 'un', stadium: 'Estadio Boston (Gillette)', homeTeamPlaceholder: '1E', awayTeamPlaceholder: '3A/B/C/D/F', bracketId: 2 },
    { phase: 'ROUND_32', date: '2026-06-29T19:00:00.000Z', homeTeam: '1F', awayTeam: '2C', homeFlag: 'un', awayFlag: 'un', stadium: 'Estadio Monterrey (BBVA)', homeTeamPlaceholder: '1F', awayTeamPlaceholder: '2C', bracketId: 3 },
    { phase: 'ROUND_32', date: '2026-06-29T22:00:00.000Z', homeTeam: '1E', awayTeam: '2F', homeFlag: 'un', awayFlag: 'un', stadium: 'Estadio Houston (NRG)', homeTeamPlaceholder: '1E', awayTeamPlaceholder: '2F', bracketId: 4 },
    { phase: 'ROUND_32', date: '2026-06-30T16:00:00.000Z', homeTeam: '1I', awayTeam: '3C/D/F/G/H', homeFlag: 'un', awayFlag: 'un', stadium: 'Estadio NY/NJ (MetLife)', homeTeamPlaceholder: '1I', awayTeamPlaceholder: '3C/D/F/G/H', bracketId: 5 },
    { phase: 'ROUND_32', date: '2026-06-30T19:00:00.000Z', homeTeam: '2E', awayTeam: '2I', homeFlag: 'un', awayFlag: 'un', stadium: 'Estadio Dallas (AT&T)', homeTeamPlaceholder: '2E', awayTeamPlaceholder: '2I', bracketId: 6 },
    { phase: 'ROUND_32', date: '2026-06-30T22:00:00.000Z', homeTeam: '1A', awayTeam: '3C/E/F/H/I', homeFlag: 'un', awayFlag: 'un', stadium: 'Estadio Azteca, CDMX', homeTeamPlaceholder: '1A', awayTeamPlaceholder: '3C/E/F/H/I', bracketId: 7 },
];

async function main() {
    console.log('🌍 Iniciando carga completa del calendario Mundial 2026...');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const matchRepository = AppDataSource.getRepository(Match);

        console.log('🗑️ Limpiando partidos existentes...');
        await matchRepository.createQueryBuilder().delete().execute();

        console.log(`📅 Insertando ${matchesData.length} partidos...`);

        for (const data of matchesData) {
            const match = new Match();
            match.group = data.group || '';
            match.date = new Date(data.date);
            match.homeTeam = data.homeTeam;
            match.awayTeam = data.awayTeam;
            match.homeFlag = data.homeFlag;
            match.awayFlag = data.awayFlag;
            match.stadium = data.stadium;
            match.phase = data.phase;
            match.status = 'PENDING';

            if (data.bracketId !== undefined) {
                match.bracketId = data.bracketId;
            }

            if (data.homeTeamPlaceholder) {
                match.homeTeamPlaceholder = data.homeTeamPlaceholder;
            }
            if (data.awayTeamPlaceholder) {
                match.awayTeamPlaceholder = data.awayTeamPlaceholder;
            }

            await matchRepository.save(match);
        }

        console.log('✅ ¡Carga de calendario completada con éxito!');
    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

main();
