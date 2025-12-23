import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { Match } from '../database/entities/match.entity';

// Phase order for unlocking
const PHASE_ORDER = ['GROUP', 'ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];

// Next phase mapping
const NEXT_PHASE = {
    'GROUP': 'ROUND_32',
    'ROUND_32': 'ROUND_16',
    'ROUND_16': 'QUARTER',
    'QUARTER': 'SEMI',
    'SEMI': 'FINAL',
    'FINAL': null,
};

@Injectable()
export class KnockoutPhasesService {
    constructor(
        @InjectRepository(KnockoutPhaseStatus)
        private phaseStatusRepository: Repository<KnockoutPhaseStatus>,
        @InjectRepository(Match)
        private matchRepository: Repository<Match>,
    ) { }

    /**
     * Get status of a specific phase
     */
    async getPhaseStatus(phase: string): Promise<KnockoutPhaseStatus> {
        const status = await this.phaseStatusRepository.findOne({
            where: { phase },
        });

        if (!status) {
            throw new NotFoundException(`Phase ${phase} not found`);
        }

        return status;
    }

    /**
     * Get status of all phases
     */
    async getAllPhasesStatus(): Promise<KnockoutPhaseStatus[]> {
        const statuses = await this.phaseStatusRepository.find({
            order: { phase: 'ASC' },
        });

        // Sort by phase order
        return statuses.sort((a, b) => {
            return PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
        });
    }

    /**
     * Check if a phase is unlocked
     */
    async isPhaseUnlocked(phase: string): Promise<boolean> {
        const status = await this.getPhaseStatus(phase);
        return status.isUnlocked;
    }

    /**
     * Manually unlock a phase (ADMIN only)
     */
    async unlockPhase(phase: string): Promise<KnockoutPhaseStatus> {
        const status = await this.getPhaseStatus(phase);

        if (status.isUnlocked) {
            throw new BadRequestException(`Phase ${phase} is already unlocked`);
        }

        status.isUnlocked = true;
        status.unlockedAt = new Date();

        return this.phaseStatusRepository.save(status);
    }

    /**
     * Check if all matches in a phase are completed
     */
    async areAllMatchesCompleted(phase: string): Promise<boolean> {
        const matches = await this.matchRepository.find({
            where: { phase },
        });

        if (matches.length === 0) {
            return false;
        }

        return matches.every(
            match => match.status === 'FINISHED' || match.status === 'COMPLETED'
        );
    }

    /**
     * Mark phase as completed and unlock next phase
     */
    async checkAndUnlockNextPhase(currentPhase: string): Promise<void> {
        console.log(`🔍 Checking if ${currentPhase} is complete...`);

        // Check if all matches are completed
        const allCompleted = await this.areAllMatchesCompleted(currentPhase);

        if (!allCompleted) {
            console.log(`⏳ ${currentPhase} not yet complete`);
            return;
        }

        // Mark current phase as completed
        const currentStatus = await this.getPhaseStatus(currentPhase);
        if (!currentStatus.allMatchesCompleted) {
            currentStatus.allMatchesCompleted = true;
            await this.phaseStatusRepository.save(currentStatus);
            console.log(`✅ ${currentPhase} marked as completed`);
        }

        // Unlock next phase
        const nextPhase = NEXT_PHASE[currentPhase];
        if (!nextPhase) {
            console.log(`🏆 ${currentPhase} is the final phase`);
            return;
        }

        const nextStatus = await this.getPhaseStatus(nextPhase);
        if (!nextStatus.isUnlocked) {
            nextStatus.isUnlocked = true;
            nextStatus.unlockedAt = new Date();
            await this.phaseStatusRepository.save(nextStatus);
            console.log(`🔓 ${nextPhase} has been unlocked!`);
        }
    }

    /**
     * Get matches for a specific phase
     */
    async getPhaseMatches(phase: string): Promise<Match[]> {
        const isUnlocked = await this.isPhaseUnlocked(phase);

        if (!isUnlocked && phase !== 'GROUP') {
            throw new BadRequestException(
                `Phase ${phase} is locked. Complete previous phase first.`
            );
        }

        return this.matchRepository.find({
            where: { phase },
            order: { date: 'ASC' },
        });
    }

    /**
     * Get next unlockable phase info
     */
    async getNextPhaseInfo(): Promise<{
        currentPhase: string;
        nextPhase: string | null;
        isComplete: boolean;
        remainingMatches: number;
    } | null> {
        const allStatuses = await this.getAllPhasesStatus();

        // Find the last unlocked phase
        const unlockedPhases = allStatuses.filter(s => s.isUnlocked);
        if (unlockedPhases.length === 0) {
            return null;
        }

        const currentPhase = unlockedPhases[unlockedPhases.length - 1];
        const isComplete = await this.areAllMatchesCompleted(currentPhase.phase);

        const matches = await this.matchRepository.find({
            where: { phase: currentPhase.phase },
        });

        const remainingMatches = matches.filter(
            m => m.status !== 'FINISHED' && m.status !== 'COMPLETED'
        ).length;

        return {
            currentPhase: currentPhase.phase,
            nextPhase: NEXT_PHASE[currentPhase.phase],
            isComplete,
            remainingMatches,
        };
    }
}
