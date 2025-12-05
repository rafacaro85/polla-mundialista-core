import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity'; // Corrected path
import { Match } from './match.entity';

@Entity('predictions')
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
}
