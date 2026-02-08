import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { League } from './league.entity';
import { User } from './user.entity';

@Entity({ name: 'league_comments' })
export class LeagueComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => League)
  @JoinColumn({ name: 'league_id' })
  league: League;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ type: 'jsonb', default: [] })
  likes: string[]; // List of user IDs who liked the comment

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
