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

@Entity({ name: 'league_banners' })
export class LeagueBanner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  tag: string;

  @Column({ name: 'button_text', nullable: true })
  buttonText: string;

  @Column({ name: 'button_url', type: 'text', nullable: true })
  buttonUrl: string;

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
