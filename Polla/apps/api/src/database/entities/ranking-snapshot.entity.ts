import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ranking_snapshots')
export class RankingSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  leagueId: string;

  @Column()
  userId: string;

  @Column()
  matchday: number;

  @Column()
  position: number;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 0 })
  regularPoints: number;

  @Column({ default: 0 })
  jokerPoints: number;

  @Column({ default: 0 })
  bonusPoints: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
