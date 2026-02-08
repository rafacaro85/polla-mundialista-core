import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { Prediction } from './prediction.entity';
import { AccessCode } from './access-code.entity';
import { LeagueParticipant } from './league-participant.entity';
import { Notification } from './notification.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ name: 'google_id', unique: true, nullable: true })
  googleId?: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role: UserRole;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;

  @Column({ name: 'has_paid', default: false })
  hasPaid: boolean;

  @Column({ name: 'verification_code', type: 'varchar', nullable: true })
  verificationCode?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => Prediction, (prediction) => prediction.user)
  predictions: Prediction[];

  @OneToMany(() => AccessCode, (accessCode) => accessCode.usedBy)
  accessCodesUsed: AccessCode[];

  @OneToMany(
    () => LeagueParticipant,
    (leagueParticipant) => leagueParticipant.user,
  )
  leagueParticipants: LeagueParticipant[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
