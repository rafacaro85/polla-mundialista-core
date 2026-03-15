import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('joker_config')
export class JokerConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tournamentId: string;

  @Column({ nullable: true })
  phase: string; // null = aplica a todas

  @Column({ nullable: true })
  group: string; // null = aplica a todos

  @Column()
  maxJokers: number;
}
