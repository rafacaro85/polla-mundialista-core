import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:admin123@localhost:5432/polla_mundialista',
  entities: [Match],
  synchronize: false,
});

async function run() {
  await AppDataSource.initialize();
  console.log('Connected.');

  // We use raw query because we suspect repository.find filters might be tricky if column missing
  // But wait, verify-flags WORKED with repository.find
  // So let's use repository.find to replicate success

  const repo = AppDataSource.getRepository(Match);
  // Find ALL matches first, no filter
  // const all = await repo.find({ take: 10 });
  // console.log("Sample 10:", all.map(m => m.homeTeam));

  // Try to find UCL
  // We assume tournamentId exists because verify-flags used it
  try {
    const ucl = await repo.find({
      where: { tournamentId: 'UCL2526' },
    });
    console.log(`UCL Matches Found: ${ucl.length}`);
    ucl.forEach((m) =>
      console.log(
        `ID: ${m.id} | Home: "${m.homeTeam}" | Flag: "${m.homeFlag}"`,
      ),
    );
  } catch (e) {
    console.error('UCL Query Failed:', e.message);

    // Fallback: search by ID or date?
    // Let's dump everything with 'Madrid' in it
    const madrid = await repo
      .createQueryBuilder('match')
      .where('match.homeTeam ILIKE :name', { name: '%Madrid%' })
      .getMany();
    console.log(
      'Matches with Madrid:',
      madrid.map((m) => m.homeTeam),
    );
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
