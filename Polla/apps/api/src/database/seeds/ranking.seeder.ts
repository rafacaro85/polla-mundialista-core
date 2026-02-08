import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { League } from '../entities/league.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { AccessCode } from '../entities/access-code.entity';
import { Organization } from '../entities/organization.entity';
import { UserRole } from '../enums/user-role.enum';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Match,
    Prediction,
    League,
    LeagueParticipant,
    AccessCode,
    Organization,
  ],
  synchronize: true, // Ensure tables exist
});

const fakeNicknames = [
  'FIFA_Pro',
  'BetKing',
  'GolazoMaster',
  'SoccerGuru',
  'LaPulga_10',
  'CR7_Legend',
  'NeymarJr_Fan',
  'Mbappe_Speed',
  'Haaland_Robot',
  'Vini_Dance',
  'Modric_Magic',
  'Kroos_Control',
  'Bellingham_Hey',
  'Pedri_Potter',
  'Gavi_Fight',
  'Lewa_Goal',
  'Kane_Hurricane',
  'Salah_King',
  'DeBruyne_Assist',
  'Courtois_Wall',
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source initialized');

    const userRepository = AppDataSource.getRepository(User);
    const matchRepository = AppDataSource.getRepository(Match);
    const predictionRepository = AppDataSource.getRepository(Prediction);

    // 1. Crear Usuarios Falsos
    console.log('Creating fake users...');
    const password = await bcrypt.hash('password123', 10);
    const createdUsers: User[] = [];

    for (const nickname of fakeNicknames) {
      let user = await userRepository.findOne({
        where: { email: `${nickname.toLowerCase()}@example.com` },
      });
      if (!user) {
        user = userRepository.create({
          email: `${nickname.toLowerCase()}@example.com`,
          password,
          fullName: nickname.replace('_', ' '),
          nickname: nickname,
          avatarUrl: `https://i.pravatar.cc/150?u=${nickname}`,
          role: UserRole.PLAYER,
        });
        await userRepository.save(user);
      }
      createdUsers.push(user);
    }

    // 2. Buscar o Crear Partido Terminado
    let match = await matchRepository.findOne({
      where: { status: 'FINISHED' },
    });

    if (!match) {
      console.log('No finished match found. Creating one...');
      match = matchRepository.create({
        homeTeam: 'Leyendas A',
        homeFlag: 'https://flagcdn.com/h80/un.png',
        awayTeam: 'Leyendas B',
        awayFlag: 'https://flagcdn.com/h80/un.png',
        date: new Date(),
        status: 'FINISHED',
        homeScore: 3,
        awayScore: 2,
      });
      await matchRepository.save(match);
    } else {
      console.log('Found existing finished match:', match.id);
    }

    // 3. Asignar Puntos Variados
    console.log('Creating predictions with points...');
    const pointsOptions = [0, 3, 5, 10, 15];

    for (const user of createdUsers) {
      // Pick random points
      const points =
        pointsOptions[Math.floor(Math.random() * pointsOptions.length)];

      // Check if prediction exists
      let prediction = await predictionRepository.findOne({
        where: { user: { id: user.id }, match: { id: match.id } },
      });

      if (!prediction) {
        prediction = predictionRepository.create({
          user,
          match,
          homeScore: 0, // Dummy score, we care about points
          awayScore: 0, // Dummy score
          points: points,
        });
      } else {
        prediction.points = points;
      }
      await predictionRepository.save(prediction);
    }

    console.log(
      `Ranking sembrado con ${createdUsers.length} usuarios y puntos variados.`,
    );
    process.exit(0);
  } catch (error) {
    console.error('Error seeding ranking:', error);
    process.exit(1);
  }
}

seed();
