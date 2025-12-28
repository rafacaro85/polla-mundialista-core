import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity'; // Corrected path
import { Match } from './match.entity';

@Entity('predictions')
@Index(['match']) // Fast lookup for match scoring
@Index(['user', 'match'], { unique: true }) // Prevent duplicate predictions per match
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user: User) => user.predictions)
  user: User;

  @ManyToOne(() => Match, match => match.predictions)
  match: Match;

  @Column()
  homeScore: number;

  @Column()
  awayScore: number;

  @Column({ default: 0 })
  points: number;

  @Column({ default: false })
  isJoker: boolean;
}
