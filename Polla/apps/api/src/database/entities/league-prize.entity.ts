import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { League } from './league.entity';

@Entity({ name: 'league_prizes' })
export class LeaguePrize {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'type' })
  type: 'image' | 'cash';

  @Column({ nullable: true })
  badge: string;

  @Column({ nullable: true })
  name: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ name: 'amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number;

  @Column({ name: 'top_label', nullable: true })
  topLabel: string;

  @Column({ name: 'bottom_label', nullable: true })
  bottomLabel: string;

  @Column({ default: 0 })
  order: number;

  @Column({ name: 'league_id' })
  leagueId: string;

  @ManyToOne(() => League, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'league_id' })
  league: League;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
