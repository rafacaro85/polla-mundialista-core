import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  leagueId: string;

  @Column()
  sessionStart: Date;

  @Column({ nullable: true })
  sessionEnd: Date;

  @Column({ default: 0 })
  durationMinutes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
