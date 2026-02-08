import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { League } from './league.entity';
import { AccessCodeStatus } from '../enums/access-code-status.enum';
import { User } from './user.entity';

@Entity({ name: 'access_codes' })
export class AccessCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @ManyToOne(() => League, (league) => league.accessCodes, { nullable: false })
  @JoinColumn({ name: 'league_id' })
  league: League;

  @Column({
    type: 'enum',
    enum: AccessCodeStatus,
    default: AccessCodeStatus.AVAILABLE,
  })
  status: AccessCodeStatus;

  @ManyToOne(() => User, (user) => user.accessCodesUsed, { nullable: true })
  @JoinColumn({ name: 'used_by_user_id' })
  usedBy?: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'used_at', type: 'timestamp with time zone', nullable: true })
  usedAt?: Date;
}
