import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { League } from './league.entity';
import { User } from './user.entity';

@Entity({ name: 'league_participants' })
@Unique(['league', 'user'])
@Index(['league', 'totalPoints']) // CRITICAL: Optimized for Leaderboard Ordering
export class LeagueParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => League)
  @JoinColumn({ name: 'league_id' })
  league: League;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'total_points', type: 'int', default: 0 })
  totalPoints: number;

  @Column({ name: 'current_rank', type: 'int', nullable: true })
  currentRank?: number;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'trivia_points', type: 'int', default: 0 })
  triviaPoints: number;

  @Column({ name: 'prediction_points', type: 'int', default: 0 }) // Added
  predictionPoints: number; // Added

  @Column({ name: 'bracket_points', type: 'int', default: 0 }) // Added
  bracketPoints: number; // Added

  @Column({ name: 'joker_points', type: 'int', default: 0 }) // Added
  jokerPoints: number; // Added

  @CreateDateColumn({ name: 'joined_at' }) // Added
  joinedAt: Date; // Added

  @Column({ name: 'tie_breaker_guess', type: 'int', nullable: true })
  tieBreakerGuess: number;

  @Column({ nullable: true })
  department?: string;
}
