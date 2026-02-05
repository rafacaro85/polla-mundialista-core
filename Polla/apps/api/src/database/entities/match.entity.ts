import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Prediction } from './prediction.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'WC2026' })
  tournamentId: string; // 'WC2026' | 'UCL2526'

  @Column()
  homeTeam: string;

  @Column()
  awayTeam: string;

  @Column({ type: 'int', nullable: true })
  homeScore: number | null;

  @Column({ type: 'int', nullable: true })
  awayScore: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ nullable: true })
  homeFlag: string;

  @Column({ nullable: true })
  awayFlag: string;

  @Column({ nullable: true })
  phase: string; // GROUP, ROUND_16, QUARTER, SEMI, FINAL, 3RD_PLACE

  @Column({ nullable: true })
  group: string; // A, B, C...

  @Column({ type: 'varchar', nullable: true })
  homeTeamPlaceholder: string | null; // e.g. '1A', 'Winner Match 49'

  @Column({ type: 'varchar', nullable: true })
  awayTeamPlaceholder: string | null;

  @Column({ type: 'int', nullable: true })
  bracketId: number; // Para ordenar visualmente las llaves (1, 2, 3...)

  @Column({ nullable: true })
  nextMatchId: string; // ID del partido al que avanza el ganador

  @Column({ default: 'PENDING' }) // Can be PENDING, COMPLETED, CANCELED
  status: string;

  @Column({ nullable: true })
  externalId: number;

  @Column({ default: false })
  isManuallyLocked: boolean; // Admin override lock

  @Column({ nullable: true })
  stadium: string;

  @Column({ type: 'text', nullable: true })
  aiPrediction: string | null; // JSON stringified analysis

  @Column({ type: 'varchar', length: 10, nullable: true })
  aiPredictionScore: string | null; // e.g., "2-1"

  @Column({ type: 'timestamp', nullable: true })
  aiPredictionGeneratedAt: Date | null;

  @OneToMany(() => Prediction, prediction => prediction.match, { cascade: true, onDelete: 'CASCADE' })
  predictions: Prediction[];
}
