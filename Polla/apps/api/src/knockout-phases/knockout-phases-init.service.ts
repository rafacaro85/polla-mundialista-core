import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';

@Injectable()
export class KnockoutPhasesInitService implements OnModuleInit {
    constructor(
        @InjectRepository(KnockoutPhaseStatus)
        private phaseStatusRepository: Repository<KnockoutPhaseStatus>,
    ) { }

    async onModuleInit() {
        await this.initializePhases();
    }

    private async initializePhases() {
        try {
            // Define tournaments to initialize
            // IMPORTANTE: Incluir TODOS los torneos activos
            const tournaments = [
                'WC2026',        // Mundial 2026
                'DEMO_WC2026',   // Demo
                'UCL2526'        // Champions League 2025-2026
            ];

            for (const tournamentId of tournaments) {
                // Check if phases already exist for this tournament
                const existingPhases = await this.phaseStatusRepository.count({
                    where: { tournamentId }
                });

                if (existingPhases > 0) {
                    console.log(`✅ Knockout phases already initialized for ${tournamentId} (${existingPhases} phases found)`);
                    continue;
                }

                console.log(`🔄 Initializing knockout phases for ${tournamentId}...`);

                // Create initial phases for this tournament
                const phases = [
                    { phase: 'GROUP', tournamentId, isUnlocked: true, unlockedAt: new Date(), allMatchesCompleted: false },
                    { phase: 'ROUND_32', tournamentId, isUnlocked: false, allMatchesCompleted: false },
                    { phase: 'ROUND_16', tournamentId, isUnlocked: false, allMatchesCompleted: false },
                    { phase: 'QUARTER', tournamentId, isUnlocked: false, allMatchesCompleted: false },
                    { phase: 'SEMI', tournamentId, isUnlocked: false, allMatchesCompleted: false },
                    { phase: 'FINAL', tournamentId, isUnlocked: false, allMatchesCompleted: false },
                ];

                for (const phaseData of phases) {
                    const phase = this.phaseStatusRepository.create(phaseData);
                    await this.phaseStatusRepository.save(phase);
                }

                console.log(`✅ Knockout phases initialized for ${tournamentId}!`);
                console.log('   - GROUP: Unlocked');
                console.log('   - ROUND_32: Locked');
                console.log('   - ROUND_16: Locked');
                console.log('   - QUARTER: Locked');
                console.log('   - SEMI: Locked');
                console.log('   - FINAL: Locked');
            }
        } catch (error) {
            console.error('❌ Error initializing knockout phases:', error);
        }
    }
}
