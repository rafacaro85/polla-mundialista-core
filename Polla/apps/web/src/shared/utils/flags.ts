/**
 * Shared utility for football team flags
 */

const FLAG_CDN = '/assets/flags';
const FALLBACK_FLAG = `${FLAG_CDN}/un.svg`;

const TEAM_TO_ISO: Record<string, string> = {
    // Common names in Spanish/English to ISO
    'Colombia': 'co', 'COL': 'co',
    'Argentina': 'ar', 'ARG': 'ar',
    'Brasil': 'br', 'BRA': 'br', 'Brazil': 'br',
    'Francia': 'fr', 'FRA': 'fr', 'France': 'fr',
    'España': 'es', 'ESP': 'es', 'Spain': 'es',
    'Alemania': 'de', 'GER': 'de', 'Germany': 'de',
    'USA': 'us', 'USA.': 'us', 'Estados Unidos': 'us', 'United States': 'us',
    'México': 'mx', 'MEX': 'mx', 'Mexico': 'mx',
    'Inglaterra': 'gb-eng', 'ENG': 'gb-eng', 'England': 'gb-eng',
    'Italia': 'it', 'ITA': 'it', 'Italy': 'it',
    'Portugal': 'pt', 'POR': 'pt',
    'Uruguay': 'uy', 'URU': 'uy',
    'Chile': 'cl', 'CHI': 'cl',
    'Ecuador': 'ec', 'ECU': 'ec',
    'Perú': 'pe', 'PER': 'pe', 'Peru': 'pe',
    'Paraguay': 'py', 'PAR': 'py',
    'Venezuela': 've', 'VEN': 've',
    'Bolivia': 'bo', 'BOL': 'bo',
    'Canadá': 'ca', 'CAN': 'ca', 'Canada': 'ca',
    'Costa Rica': 'cr', 'CRC': 'cr',
    'Jamaica': 'jm', 'JAM': 'jm',
    'Panamá': 'pa', 'PAN': 'pa', 'Panama': 'pa',
    'Haití': 'ht', 'HAI': 'ht', 'Haiti': 'ht',
    'Australia': 'au', 'AUS': 'au',
    'Catar': 'qa', 'CAT': 'qa', 'Qatar': 'qa',
    'Sudáfrica': 'za', 'RSA': 'za', 'South Africa': 'za',
    'Corea del Sur': 'kr', 'KOR': 'kr', 'República de Corea': 'kr', 'South Korea': 'kr',
    'Japón': 'jp', 'JPN': 'jp', 'Japan': 'jp',
    'Marruecos': 'ma', 'MAR': 'ma', 'Morocco': 'ma',
    'Senegal': 'sn', 'SEN': 'sn',
    'Países Bajos': 'nl', 'NED': 'nl', 'Netherlands': 'nl',
    'Irán': 'ir', 'IRN': 'ir', 'Iran': 'ir',
    'Gales': 'gb-wls', 'WAL': 'gb-wls', 'Wales': 'gb-wls',
    'Bélgica': 'be', 'BEL': 'be', 'Belgium': 'be',
    'Croacia': 'hr', 'CRO': 'hr', 'Croatia': 'hr',
    'Egipto': 'eg', 'EGY': 'eg', 'Egypt': 'eg',
    'Serbia': 'rs', 'SRB': 'rs',
    'Escocia': 'gb-sct', 'SCO': 'gb-sct', 'Scotland': 'gb-sct',
    'Arabia Saudita': 'sa', 'Arabia Saudí': 'sa', 'KSA': 'sa', 'Saudi Arabia': 'sa',
    'Polonia': 'pl', 'POL': 'pl', 'Poland': 'pl',
    'Túnez': 'tn', 'TUN': 'tn', 'Tunisia': 'tn',
    'Austria': 'at', 'AUT': 'at',
    'Nueva Zelanda': 'nz', 'NZL': 'nz', 'New Zealand': 'nz',
    'Costa del Marfil': 'ci', 'CIV': 'ci', 'Ivory Coast': 'ci',
    'Noruega': 'no', 'NOR': 'no', 'Norway': 'no',
    'Argelia': 'dz', 'ALG': 'dz', 'Algeria': 'dz',
    'Uzbekistán': 'uz', 'UZB': 'uz', 'Uzbekistan': 'uz',
    'Ghana': 'gh', 'GHA': 'gh',
    'Cabo Verde': 'cv', 'CPV': 'cv', 'Cape Verde': 'cv',
    'Curazao': 'cw', 'CUW': 'cw', 'Curacao': 'cw',
    'Suiza': 'ch', 'SUI': 'ch', 'Switzerland': 'ch',
    'Grecia': 'gr', 'GRE': 'gr', 'Greece': 'gr',
    'Finlandia': 'fi', 'FIN': 'fi', 'Finland': 'fi',
    'Suecia': 'se', 'SWE': 'se', 'Sweden': 'se',
    'Honduras': 'hn', 'HON': 'hn',
    'QAT': 'qa', 'SAU': 'sa', 'DEN': 'dk', 'CMR': 'cm'
};

export const getTeamFlagUrl = (teamName: string) => {
    if (!teamName) return FALLBACK_FLAG;

    const normalized = teamName.trim();

    // Placeholders
    if (normalized === '-' || normalized === 'TBD' || normalized === 'LOC' || normalized === 'VIS' ||
        normalized.includes('W32') || normalized.includes('W16') || normalized.includes('W8') ||
        normalized.includes('1') || normalized.includes('2') || normalized.includes('3')) {
        // Check if it's a valid code first before dismissing as placeholder if it's strictly a team
        if (!TEAM_TO_ISO[normalized]) return FALLBACK_FLAG;
    }

    const iso = TEAM_TO_ISO[normalized];
    if (iso) return `${FLAG_CDN}/${iso}.svg`;

    // Last resort attempt with first 2 chars (risky but sometimes works for ISO codes)
    // However, after the user reports, let's be more strict to avoid Qatar -> Canada (CA)
    // return `${FLAG_CDN}/${normalized.substring(0, 2).toLowerCase()}.png`;

    return FALLBACK_FLAG;
};
