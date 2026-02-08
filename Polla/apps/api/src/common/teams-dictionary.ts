export interface TeamEntry {
  name: string;
  flag: string; // ISO code for flagcdn or full URL
}

export const TEAMS_DICTIONARY: Record<string, TeamEntry> = {
  // CONCACAF
  MEX: { name: 'México', flag: 'mx' },
  USA: { name: 'Estados Unidos', flag: 'us' },
  CAN: { name: 'Canadá', flag: 'ca' },
  PAN: { name: 'Panamá', flag: 'pa' },
  JAM: { name: 'Jamaica', flag: 'jm' },
  CRC: { name: 'Costa Rica', flag: 'cr' },
  HON: { name: 'Honduras', flag: 'hn' },
  HAI: { name: 'Haití', flag: 'ht' },

  // CONMEBOL
  BRA: { name: 'Brasil', flag: 'br' },
  ARG: { name: 'Argentina', flag: 'ar' },
  COL: { name: 'Colombia', flag: 'co' },
  URU: { name: 'Uruguay', flag: 'uy' },
  ECU: { name: 'Ecuador', flag: 'ec' },
  PAR: { name: 'Paraguay', flag: 'py' },
  CHI: { name: 'Chile', flag: 'cl' },
  VEN: { name: 'Venezuela', flag: 've' },
  PER: { name: 'Perú', flag: 'pe' },
  BOL: { name: 'Bolivia', flag: 'bo' },

  // UEFA
  FRA: { name: 'Francia', flag: 'fr' },
  ENG: { name: 'Inglaterra', flag: 'gb-eng' },
  ESP: { name: 'España', flag: 'es' },
  GER: { name: 'Alemania', flag: 'de' },
  ITA: { name: 'Italia', flag: 'it' },
  NED: { name: 'Países Bajos', flag: 'nl' },
  POR: { name: 'Portugal', flag: 'pt' },
  BEL: { name: 'Bélgica', flag: 'be' },
  CRO: { name: 'Croacia', flag: 'hr' },
  DEN: { name: 'Dinamarca', flag: 'dk' },
  SUI: { name: 'Suiza', flag: 'ch' },
  POL: { name: 'Polonia', flag: 'pl' },
  SWE: { name: 'Suecia', flag: 'se' },
  NOR: { name: 'Noruega', flag: 'no' },
  AUT: { name: 'Austria', flag: 'at' },
  SCO: { name: 'Escocia', flag: 'gb-sct' },
  WAL: { name: 'Gales', flag: 'gb-wls' },
  TUR: { name: 'Turquía', flag: 'tr' },
  ROU: { name: 'Rumania', flag: 'ro' },
  SVK: { name: 'Eslovaquia', flag: 'sk' },
  XKX: { name: 'Kosovo', flag: 'xk' },
  UKR: { name: 'Ucrania', flag: 'ua' },
  ALB: { name: 'Albania', flag: 'al' },
  SRB: { name: 'Serbia', flag: 'rs' }, // Agrego Serbia por si acaso también falta
  SVN: { name: 'Eslovenia', flag: 'si' },
  HUN: { name: 'Hungría', flag: 'hu' },
  CZE: { name: 'República Checa', flag: 'cz' },

  // CAF (Africa)
  MAR: { name: 'Marruecos', flag: 'ma' },
  SEN: { name: 'Senegal', flag: 'sn' },
  TUN: { name: 'Túnez', flag: 'tn' },
  ALG: { name: 'Argelia', flag: 'dz' },
  EGY: { name: 'Egipto', flag: 'eg' },
  NGA: { name: 'Nigeria', flag: 'ng' },
  CMR: { name: 'Camerún', flag: 'cm' },
  GHA: { name: 'Ghana', flag: 'gh' },
  CIV: { name: 'Costa del Marfil', flag: 'ci' },
  CPV: { name: 'Cabo Verde', flag: 'cv' },
  RSA: { name: 'Sudáfrica', flag: 'za' },

  // AFC (Asia)
  JPN: { name: 'Japón', flag: 'jp' },
  KOR: { name: 'República de Corea', flag: 'kr' },
  AUS: { name: 'Australia', flag: 'au' },
  IRN: { name: 'Irán', flag: 'ir' },
  KSA: { name: 'Arabia Saudí', flag: 'sa' },
  QAT: { name: 'Catar', flag: 'qa' },
  JOR: { name: 'Jordania', flag: 'jo' },
  UZB: { name: 'Uzbekistán', flag: 'uz' },

  // OFC (Oceania)
  NZL: { name: 'Nueva Zelanda', flag: 'nz' },

  // REPECHAJES (Placeholders)
  PLA_A: { name: 'PLA_A', flag: 'un' },
  PLA_B: { name: 'PLA_B', flag: 'un' },
  PLA_C: { name: 'PLA_C', flag: 'un' },
  PLA_D: { name: 'PLA_D', flag: 'un' },
  PLA_E: { name: 'PLA_E', flag: 'un' },
  PLA_F: { name: 'PLA_F', flag: 'un' },

  // SPECIAL
  TBD: { name: 'Por Definir', flag: 'un' },
};

export function getTeamInfo(code: string): TeamEntry {
  const entry = TEAMS_DICTIONARY[code];
  if (!entry) {
    throw new Error(`Team Code '${code}' not found in dictionary.`);
  }
  // Determinar URL de bandera
  let flagUrl = entry.flag;
  if (!flagUrl.startsWith('http')) {
    flagUrl = `https://flagcdn.com/w40/${entry.flag}.png`;
  }
  return { name: entry.name, flag: flagUrl };
}
