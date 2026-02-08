import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity'; // Corrected path
import { Match } from './match.entity';

@Entity('predictions')
@Index(['match']) // Fast lookup for match scoring
@Index(['user', 'leagueId']) // Optimized for loading Game Screen (User in League)
@Index(['user', 'match', 'leagueId'], { unique: true }) // Prevent duplicate predictions per match + league
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'WC2026' })
  tournamentId: string;

  @ManyToOne(() => User, (user: User) => user.predictions)
  user: User;

  @ManyToOne(() => Match, (match) => match.predictions, { onDelete: 'CASCADE' })
  match: Match;

  @Column({ name: 'league_id', nullable: true })
  leagueId: string;

  @Column()
  homeScore: number;

  @Column()
  awayScore: number;

  @Column({ default: 0 })
  points: number;

  @Column({ default: false })
  isJoker: boolean;
}
