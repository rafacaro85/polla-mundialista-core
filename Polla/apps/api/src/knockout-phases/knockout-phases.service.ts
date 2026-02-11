import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { Match } from '../database/entities/match.entity';

// Phase order for unlocking (Merged list for all tournaments)
const PHASE_ORDER = [
  'GROUP',
  'PLAYOFF',
  'PLAYOFF_1',
  'PLAYOFF_2',
  'ROUND_32',
  'ROUND_16',
  'QUARTER',
  'SEMI',
  '3RD_PLACE',
  'FINAL',
];

// Next phase mapping
const NEXT_PHASE: { [key: string]: string | null } = {
  GROUP: 'PLAYOFF', // WC2026 goes GROUP -> ROUND_32 usually, but we handle logic dynamically?
  // Actually WC2026 is GROUP -> ROUND_32. UCL is PLAYOFF -> ROUND_16.
  // We need dynamic next phase based on tournament?
  // For now, let's map loosely, or better, keep it simple mapping.
  // If tournamentId='WC2026', GROUP -> ROUND_32.
  // If 'UCL2526', PLAYOFF -> ROUND_16.
  // UCL Flow
  PLAYOFF_1: 'PLAYOFF_2',
  PLAYOFF_2: 'ROUND_16',
  
  // Existing
  PLAYOFF: 'ROUND_16',
  ROUND_32: 'ROUND_16',
  ROUND_16: 'QUARTER',
  QUARTER: 'SEMI',
  SEMI: '3RD_PLACE',
  '3RD_PLACE': 'FINAL',
  FINAL: null,
};

import { EventEmitter2 } from '@nestjs/event-emitter';
import { PhaseCompletedEvent } from '../notifications/listeners/phase-completed.listener';

@Injectable()
export class KnockoutPhasesService {
  constructor(
    @InjectRepository(KnockoutPhaseStatus)
    private phaseStatusRepository: Repository<KnockoutPhaseStatus>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private eventEmitter: EventEmitter2,
  ) {}

  private getNextPhase(current: string, tournamentId: string): string | null {
    if (tournamentId === 'WC2026' && current === 'GROUP') return 'ROUND_32';
    
    // UCL Specific
    if (tournamentId === 'UCL2526') {
        if (current === 'PLAYOFF_1') return 'PLAYOFF_2';
        if (current === 'PLAYOFF_2') return 'ROUND_16';
        if (current === 'GROUP') return 'PLAYOFF_1'; // Just in case
    }
    
    if (tournamentId === 'UCL2526' && current === 'PLAYOFF') return 'ROUND_16'; // Legacy/Fallback

    return NEXT_PHASE[current] || null;
  }

  /**
   * Get status of a specific phase
   */
  async getPhaseStatus(
    phase: string,
    tournamentId: string,
  ): Promise<KnockoutPhaseStatus> {
    const status = await this.phaseStatusRepository.findOne({
      where: { phase, tournamentId },
    });

    if (!status) {
      // Auto-create if missing (Optimization for new tournaments)
      // But usually we seed. Let's return mock or throw?
      // Throwing makes UI fail.
      // Return a default locked status object (not saved) to prevent UI crash?
      // Better to throw so we know something is wrong, OR return default locked.
      // Check usage: usually used to check 'isUnlocked'.
      return {
        phase,
        isUnlocked: false,
        allMatchesCompleted: false,
        tournamentId,
      } as KnockoutPhaseStatus;
    }

    return status;
  }

  /**
   * Get status of all phases for a tournament
   */
  async getAllPhasesStatus(
    tournamentId: string,
  ): Promise<KnockoutPhaseStatus[]> {
    const statuses = await this.phaseStatusRepository.find({
      where: { tournamentId },
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
  async isPhaseUnlocked(phase: string, tournamentId: string): Promise<boolean> {
    const status = await this.getPhaseStatus(phase, tournamentId);
    return status.isUnlocked;
  }

  /**
   * Manually unlock a phase (ADMIN only)
   */
  async unlockPhase(
    phase: string,
    tournamentId: string,
  ): Promise<KnockoutPhaseStatus> {
    let status = await this.phaseStatusRepository.findOne({
      where: { phase, tournamentId },
    });

    if (!status) {
      status = this.phaseStatusRepository.create({
        phase,
        tournamentId,
        isUnlocked: false,
      });
    }

    if (status.isUnlocked) {
      return status;
    }

    status.isUnlocked = true;
    status.unlockedAt = new Date();

    return this.phaseStatusRepository.save(status);
  }

  /**
   * Check if all matches in a phase are completed
   */
  async areAllMatchesCompleted(
    phase: string,
    tournamentId: string,
  ): Promise<boolean> {
    const matches = await this.matchRepository.find({
      where: { phase, tournamentId },
    });

    if (matches.length === 0) {
      return false;
    }

    return matches.every(
      (match) => match.status === 'FINISHED' || match.status === 'COMPLETED',
    );
  }

  /**
   * Mark phase as completed and unlock next phase
   */
  async checkAndUnlockNextPhase(
    currentPhase: string,
    tournamentId: string,
  ): Promise<void> {
    console.log(
      `🔍 Checking if ${currentPhase} is complete for ${tournamentId}...`,
    );

    // Check if all matches are completed
    const allCompleted = await this.areAllMatchesCompleted(
      currentPhase,
      tournamentId,
    );

    if (!allCompleted) {
      console.log(`⏳ ${currentPhase} not yet complete`);
      return;
    }

    // ATOMIC UPDATE
    const updateResult = await this.phaseStatusRepository
      .createQueryBuilder()
      .update(KnockoutPhaseStatus)
      .set({ allMatchesCompleted: true })
      .where('phase = :phase', { phase: currentPhase })
      .andWhere('tournamentId = :tournamentId', { tournamentId })
      .andWhere('allMatchesCompleted = :status', { status: false })
      .execute();

    if (updateResult.affected && updateResult.affected > 0) {
      console.log(`✅ ${currentPhase} marked as completed (Atomic Update)`);

      this.eventEmitter.emit(
        'phase.completed',
        new PhaseCompletedEvent(currentPhase, tournamentId),
      );

      // Unlock next phase
      let nextPhase = this.getNextPhase(currentPhase, tournamentId);
      
      // EXCEPTION: UCL Round of 16 requires manual seeding/unlock
      if (tournamentId === 'UCL2526' && nextPhase === 'ROUND_16') {
          console.log(`🛑 Stopping auto-unlock for ${nextPhase} in ${tournamentId} (Manual Unlock Required)`);
          return;
      }

      if (!nextPhase) {
        console.log(`🏆 ${currentPhase} is the final phase`);
        return;
      }

      // Create next status if not exists
      let nextStatus = await this.phaseStatusRepository.findOne({
        where: { phase: nextPhase, tournamentId },
      });
      if (!nextStatus) {
        nextStatus = this.phaseStatusRepository.create({
          phase: nextPhase,
          tournamentId,
          isUnlocked: false,
        });
      }

      if (!nextStatus.isUnlocked) {
        nextStatus.isUnlocked = true;
        nextStatus.unlockedAt = new Date();
        await this.phaseStatusRepository.save(nextStatus);
        console.log(`🔓 ${nextPhase} has been unlocked!`);
      }
    } else {
      console.log(
        `ℹ️ ${currentPhase} was already completed or updated by another process.`,
      );
    }
  }

  /**
   * Get matches for a specific phase
   */
  async getPhaseMatches(phase: string, tournamentId: string): Promise<Match[]> {
    const isUnlocked = await this.isPhaseUnlocked(phase, tournamentId);

    // Special rule for first phase?
    // If it's the first phase of the tournament, it should be open maybe?
    // But logic says check isUnlocked. Seeder should unlock first phase.
    if (!isUnlocked) {
      console.log(`Phase ${phase} is locked for ${tournamentId}`);
      // return []; // Or throw?
    }

    return this.matchRepository.find({
      where: { phase, tournamentId },
      order: { date: 'ASC' },
    });
  }

  /**
   * Get next unlockable phase info
   */
  async getNextPhaseInfo(tournamentId: string): Promise<{
    currentPhase: string;
    nextPhase: string | null;
    isComplete: boolean;
    remainingMatches: number;
  } | null> {
    const allStatuses = await this.getAllPhasesStatus(tournamentId);

    // Find the last unlocked phase
    const unlockedPhases = allStatuses.filter((s) => s.isUnlocked);
    if (unlockedPhases.length === 0) {
      return null;
    }

    const currentPhase = unlockedPhases[unlockedPhases.length - 1];
    const isComplete = await this.areAllMatchesCompleted(
      currentPhase.phase,
      tournamentId,
    );

    const matches = await this.matchRepository.find({
      where: { phase: currentPhase.phase, tournamentId },
    });

    const remainingMatches = matches.filter(
      (m) => m.status !== 'FINISHED' && m.status !== 'COMPLETED',
    ).length;

    return {
      currentPhase: currentPhase.phase,
      nextPhase: this.getNextPhase(currentPhase.phase, tournamentId),
      isComplete,
      remainingMatches,
    };
  }
}
