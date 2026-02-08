import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { Match } from '../database/entities/match.entity';

// Hardcoded map for WC flags to download (from flags.ts logic)
// We will download these from flagcdn
const WC_COUNTRIES: Record<string, string> = {
  co: 'co',
  ar: 'ar',
  br: 'br',
  fr: 'fr',
  es: 'es',
  de: 'de',
  us: 'us',
  mx: 'mx',
  'gb-eng': 'gb-eng',
  it: 'it',
  pt: 'pt',
  uy: 'uy',
  cl: 'cl',
  ec: 'ec',
  pe: 'pe',
  py: 'py',
  ve: 've',
  bo: 'bo',
  ca: 'ca',
  cr: 'cr',
  jm: 'jm',
  pa: 'pa',
  ht: 'ht',
  au: 'au',
  qa: 'qa',
  za: 'za',
  kr: 'kr',
  jp: 'jp',
  ma: 'ma',
  sn: 'sn',
  nl: 'nl',
  ir: 'ir',
  'gb-wls': 'gb-wls',
  be: 'be',
  hr: 'hr',
  eg: 'eg',
  rs: 'rs',
  'gb-sct': 'gb-sct',
  sa: 'sa',
  pl: 'pl',
  tn: 'tn',
  at: 'at',
  nz: 'nz',
  ci: 'ci',
  no: 'no',
  dz: 'dz',
  uz: 'uz',
  gh: 'gh',
  cv: 'cv',
  cw: 'cw',
  ch: 'ch',
  gr: 'gr',
  fi: 'fi',
  se: 'se',
  hn: 'hn',
  dk: 'dk',
  cm: 'cm',
};

const LOGO_MAP: Record<string, string> = {
  // Pot 1
  'real-madrid': 'https://crests.football-data.org/86.svg',
  'manchester-city': 'https://crests.football-data.org/65.svg',
  'bayern-munich': 'https://crests.football-data.org/5.svg',
  'paris-saint-germain': 'https://crests.football-data.org/524.svg',
  liverpool: 'https://crests.football-data.org/64.svg',
  'inter-milan': 'https://crests.football-data.org/108.svg',
  dortmund: 'https://crests.football-data.org/4.svg',
  'rb-leipzig': 'https://crests.football-data.org/721.svg',
  barcelona: 'https://crests.football-data.org/81.svg',

  // Pot 2
  'bayer-leverkusen': 'https://crests.football-data.org/3.svg',
  'atletico-madrid': 'https://crests.football-data.org/78.svg',
  atalanta: 'https://crests.football-data.org/102.svg',
  juventus: 'https://crests.football-data.org/109.svg',
  benfica: 'https://crests.football-data.org/1903.svg',
  arsenal: 'https://crests.football-data.org/57.svg',
  'club-brugge': 'https://crests.football-data.org/312.svg',
  'shakhtar-donetsk':
    'https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Shakhtar_Donetsk.svg',
  'ac-milan': 'https://crests.football-data.org/98.svg',

  // Pot 3
  feyenoord: 'https://crests.football-data.org/675.svg',
  'sporting-cp': 'https://crests.football-data.org/498.svg',
  psv: 'https://crests.football-data.org/674.svg',
  'dinamo-zagreb':
    'https://upload.wikimedia.org/wikipedia/commons/2/23/NK_Dinamo_Zagreb.svg',
  salzburg: 'https://crests.football-data.org/1877.svg',
  lille: 'https://crests.football-data.org/521.svg',
  'red-star-belgrade':
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg',
  'young-boys': 'https://crests.football-data.org/1871.svg',
  celtic: 'https://crests.football-data.org/732.svg',

  // Pot 4
  'slovan-bratislava':
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/ŠK_Slovan_Bratislava_logo.svg',
  monaco: 'https://crests.football-data.org/548.svg',
  'sparta-prague': 'https://crests.football-data.org/6200.svg',
  'aston-villa': 'https://crests.football-data.org/58.svg',
  bologna: 'https://crests.football-data.org/103.svg',
  girona: 'https://crests.football-data.org/298.svg',
  stuttgart: 'https://crests.football-data.org/10.svg',
  'sturm-graz': 'https://crests.football-data.org/202.svg',
  brest: 'https://crests.football-data.org/512.svg',

  // Extras
  galatasaray: 'https://crests.football-data.org/610.svg',
  'bodo-glimt': 'https://crests.football-data.org/444.svg',
  newcastle: 'https://crests.football-data.org/67.svg',
  olympiacos: 'https://crests.football-data.org/654.svg',
  qarabag: 'https://crests.football-data.org/5123.svg',
};

const FLAGS_DIR = path.join(
  __dirname,
  '../../../../apps/web/public/assets/flags',
);
const UCL_DIR = path.join(__dirname, '../../../../apps/web/public/assets/ucl');

async function downloadImage(url: string, filepath: string) {
  try {
    const writer = fs.createWriteStream(filepath);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    response.data.pipe(writer);

    return new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message);
  }
}

async function run() {
  console.log('📥 Starting Assets Download...');

  // 1. WC Flags
  console.log('Downloading WC Flags...');
  for (const [code, iso] of Object.entries(WC_COUNTRIES)) {
    const url = `https://flagcdn.com/${iso}.svg`;
    // flagcdn simple svgs are just iso.svg? No, logic says /iso.svg usually.
    // Actually flags.ts uses /h80/${iso}.png but user wants SVGs.
    // FlagCDN svgs are at https://flagcdn.com/{iso}.svg

    const filepath = path.join(FLAGS_DIR, `${code}.svg`);
    if (!fs.existsSync(filepath)) {
      process.stdout.write(`Downloading ${code}... `);
      await downloadImage(url, filepath);
      console.log('OK');
    } else {
      // console.log(`Skipping ${code} (exists)`);
    }
  }

  // 2. UCL Logos
  console.log('\nDownloading UCL Logos...');
  for (const [slug, url] of Object.entries(LOGO_MAP)) {
    const filepath = path.join(UCL_DIR, `${slug}.svg`);
    if (!fs.existsSync(filepath)) {
      process.stdout.write(`Downloading ${slug}... `);
      await downloadImage(url, filepath);
      console.log('OK');
    }
  }

  console.log('\n✅ Done!');
}

run();
