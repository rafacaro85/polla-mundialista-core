import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity'; // Import User entity
import { LeagueType } from '../enums/league-type.enum';
import { LeagueStatus } from '../enums/league-status.enum';
import { LeagueParticipant } from './league-participant.entity'; // Import LeagueParticipant entity
import { AccessCode } from './access-code.entity';

@Entity({ name: 'leagues' })
export class League {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({
    type: 'enum',
    enum: LeagueType,
  })
  type: LeagueType;

  @Column({ name: 'access_code_prefix', nullable: true })
  accessCodePrefix?: string;



  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ default: 3 })
  maxParticipants: number;

  @Column({
    type: 'enum',
    enum: LeagueStatus,
    default: LeagueStatus.ACTIVE,
  })
  status: LeagueStatus;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  @Column({ name: 'package_type', default: 'starter' })
  packageType: string;

  @Column({ name: 'branding_logo_url', nullable: true })
  brandingLogoUrl?: string;

  @Column({ name: 'prize_details', type: 'text', nullable: true })
  prizeDetails?: string;

  @Column({ name: 'prize_image_url', nullable: true })
  prizeImageUrl?: string;

  @Column({ name: 'welcome_message', type: 'text', nullable: true })
  welcomeMessage?: string;

  @OneToMany(() => LeagueParticipant, participant => participant.league)
  participants: LeagueParticipant[];

  @OneToMany(() => AccessCode, accessCode => accessCode.league)
  accessCodes: AccessCode[];
}
