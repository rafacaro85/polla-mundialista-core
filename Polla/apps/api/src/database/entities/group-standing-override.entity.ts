import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('group_standing_overrides')
export class GroupStandingOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'WC2026' })
  tournamentId: string;

  @Column()
  group: string;

  @Column()
  team: string;

  @Column({ type: 'int' })
  manualPosition: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
