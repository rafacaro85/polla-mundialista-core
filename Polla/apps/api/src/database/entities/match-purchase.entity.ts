import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'match_purchases' })
export class MatchPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'leagueId' })
  leagueId: string;

  @Column({ name: 'matchId', nullable: true })
  matchId?: string;

  @Column({ name: 'packageId', nullable: true })
  packageId?: string;

  @Column()
  amount: number;

  @Column({ default: 'PENDING' })
  status: string; // PENDING | APPROVED | REJECTED

  @Column({ name: 'voucherUrl', nullable: true })
  voucherUrl?: string;

  @Column({ default: 20 })
  participants: number;

  @Column({ type: 'jsonb', nullable: true })
  items?: {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    participants: number;
    pricePerPerson: number;
    subtotal: number;
  }[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
