import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { Match } from '../database/entities/match.entity';

dotenv.config({ path: join(__dirname, '../../../../.env') }); // Adjust path to root .env if needed

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Match],
  synchronize: false,
  logging: false,
});

async function main() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to DB');

    const teams = await AppDataSource.getRepository(Match)
      .createQueryBuilder('match')
      .select('DISTINCT match.homeTeam', 'team')
      .where('match.tournamentId = :tid', { tid: 'UCL2526' })
      .orderBy('team', 'ASC')
      .getRawMany();

    console.log('Teams in UCL2526:');
    teams.forEach((t) => console.log(`- ${t.team}`));
  } catch (err) {
    console.error(err);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
