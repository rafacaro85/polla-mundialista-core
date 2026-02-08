import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { League } from './league.entity';

@Entity('bonus_questions')
export class BonusQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string; // "¿Quién será el goleador del torneo?"

  @Column()
  points: number; // Valor de la pregunta (ej: 10 puntos)

  @Column({ default: 'WC2026' })
  tournamentId: string;

  @Column({ nullable: true })
  correctAnswer: string; // Se llena cuando admin califica

  @Column({ default: true })
  isActive: boolean; // Si la pregunta está activa

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => League, { nullable: true })
  @JoinColumn({ name: 'league_id' })
  league: League;

  @Column({ name: 'league_id', nullable: true })
  leagueId: string;

  @Column({ default: 'OPEN' })
  type: 'OPEN' | 'MULTIPLE';

  @Column({ type: 'simple-json', nullable: true })
  options: string[];
}
