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
            // Check if phases already exist
            const existingPhases = await this.phaseStatusRepository.count();

            if (existingPhases > 0) {
                console.log(`✅ Knockout phases already initialized (${existingPhases} phases found)`);
                return;
            }

            console.log('🔄 Initializing knockout phases...');

            // Create initial phases
            const phases = [
                { phase: 'GROUP', isUnlocked: true, unlockedAt: new Date() },
                { phase: 'ROUND_32', isUnlocked: false },
                { phase: 'ROUND_16', isUnlocked: false },
                { phase: 'QUARTER', isUnlocked: false },
                { phase: 'SEMI', isUnlocked: false },
                { phase: 'FINAL', isUnlocked: false },
            ];

            for (const phaseData of phases) {
                const phase = this.phaseStatusRepository.create(phaseData);
                await this.phaseStatusRepository.save(phase);
            }

            console.log('✅ Knockout phases initialized successfully!');
            console.log('   - GROUP: Unlocked');
            console.log('   - ROUND_32: Locked');
            console.log('   - ROUND_16: Locked');
            console.log('   - QUARTER: Locked');
            console.log('   - SEMI: Locked');
            console.log('   - FINAL: Locked');
        } catch (error) {
            console.error('❌ Error initializing knockout phases:', error);
        }
    }
}
