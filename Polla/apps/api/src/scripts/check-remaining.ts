
const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
dotenv.config();

// Match Entity Mock
const { Entity, PrimaryGeneratedColumn, Column } = require('typeorm');
@Entity('matches')
class Match {
  @PrimaryGeneratedColumn('uuid') id;
  @Column() homeTeam;
  @Column() awayTeam;
  @Column({ name: 'aiPrediction', nullable: true }) aiPrediction;
}

const AppDataSource = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
    entities: [Match],
    ssl: { rejectUnauthorized: false },
});

async function check() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Match);
    const matches = await repo.createQueryBuilder('match')
        .where('match.homeTeam IS NOT NULL')
        .andWhere('match.awayTeam IS NOT NULL')
        .andWhere('match.aiPrediction IS NULL')
        .getMany();
    
    console.log(`Remaining matches: ${matches.length}`);
    matches.forEach(m => {
        console.log(`ID: ${m.id}, Home: "${m.homeTeam}", Away: "${m.awayTeam}"`);
    });
    process.exit(0);
}

check();
