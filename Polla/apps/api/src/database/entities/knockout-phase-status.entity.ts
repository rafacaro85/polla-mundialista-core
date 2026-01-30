import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'knockout_phase_status' })
export class KnockoutPhaseStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 20 })
    phase: string; // GROUP, ROUND_32, ROUND_16, QUARTER, SEMI, FINAL

    @Column({ name: 'is_unlocked', default: false })
    isUnlocked: boolean;

    @Column({ name: 'unlocked_at', type: 'timestamp', nullable: true })
    unlockedAt: Date;

    @Column({ name: 'all_matches_completed', default: false })
    allMatchesCompleted: boolean;

    @Column({ name: 'is_manually_locked', default: false })
    isManuallyLocked: boolean; // Admin override lock for entire phase

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
