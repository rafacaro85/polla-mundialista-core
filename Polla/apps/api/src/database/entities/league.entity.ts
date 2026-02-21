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

  @Column({ name: 'tournamentId', default: 'WC2026' })
  tournamentId: string;

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

  @Column({ name: 'maxParticipants', default: 3 })
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

  @Column({ name: 'prize_type', default: 'image' })
  prizeType: string;

  @Column({ name: 'prize_amount', type: 'decimal', nullable: true, precision: 15, scale: 2 })
  prizeAmount?: number;

  @Column({ name: 'welcome_message', type: 'text', nullable: true })
  welcomeMessage?: string;

  // --- ENTERPRISE FEATURES ---

  @Column({ name: 'is_enterprise', default: false })
  isEnterprise: boolean;

  @Column({ name: 'is_enterprise_active', default: false })
  isEnterpriseActive: boolean;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'enable_department_war', default: false })
  enableDepartmentWar: boolean;

  @Column({ name: 'brand_color_primary', default: '#00E676' })
  brandColorPrimary: string;

  @Column({ name: 'brand_color_secondary', default: '#1E293B' })
  brandColorSecondary: string;

  @Column({ name: 'brand_color_bg', default: '#0F172A' })
  brandColorBg: string;

  @Column({ name: 'brand_color_text', default: '#F8FAFC' })
  brandColorText: string;

  @Column({ name: 'brand_font_family', default: '"Russo One", sans-serif' })
  brandFontFamily: string;

  @Column({ name: 'brand_cover_url', nullable: true })
  brandCoverUrl?: string; // Banner Hero

  @OneToMany(() => LeagueParticipant, (participant) => participant.league)
  participants: LeagueParticipant[];

  @OneToMany(() => AccessCode, (accessCode) => accessCode.league)
  accessCodes: AccessCode[];

  @Column({ name: 'admin_name', nullable: true })
  adminName?: string;

  @Column({ name: 'admin_phone', nullable: true })
  adminPhone?: string;
  // --- SOCIAL MEDIA ---

  @Column({ name: 'social_instagram', nullable: true })
  socialInstagram?: string;

  @Column({ name: 'social_facebook', nullable: true })
  socialFacebook?: string;

  @Column({ name: 'social_whatsapp', nullable: true })
  socialWhatsapp?: string;

  @Column({ name: 'social_youtube', nullable: true })
  socialYoutube?: string;

  @Column({ name: 'social_tiktok', nullable: true })
  socialTiktok?: string;

  @Column({ name: 'social_linkedin', nullable: true })
  socialLinkedin?: string;

  @Column({ name: 'social_website', nullable: true })
  socialWebsite?: string;

  // --- ADVERTISING (Enterprise) ---
  @Column({ name: 'show_ads', default: false })
  showAds: boolean;

  @Column({ name: 'ad_images', type: 'simple-array', nullable: true })
  adImages?: string[];
}
