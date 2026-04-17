import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('analytics_cache')
export class AnalyticsCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  leagueId: string;

  @Column()
  reportType: string;

  @Column({ type: 'jsonb' })
  data: any;

  @CreateDateColumn({ name: 'computed_at' })
  computedAt: Date;
}
