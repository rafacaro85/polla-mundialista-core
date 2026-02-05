import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';

@Entity('user_brackets')
export class UserBracket {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'WC2026' })
    tournamentId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => League, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'leagueId' })
    league: League;

    @Column({ nullable: true })
    leagueId: string;

    @Column('jsonb', { default: {} })
    picks: Record<string, string>; // matchId -> teamName

    @Column({ default: 0 })
    points: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
