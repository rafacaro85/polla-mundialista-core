import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { League } from './league.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Entity({ name: 'transactions' })
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;

    @Column({ name: 'reference_code', unique: true })
    referenceCode: string;

    @Column({ name: 'package_id', nullable: true })
    packageId?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => League, { nullable: true })
    @JoinColumn({ name: 'league_id' })
    league: League;
}
