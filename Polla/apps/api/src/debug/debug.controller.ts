import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';

@Controller('debug')
export class DebugController {
    constructor(
        @InjectRepository(BonusQuestion)
        private bonusQuestionRepository: Repository<BonusQuestion>,
        @InjectRepository(UserBonusAnswer)
        private userBonusAnswerRepository: Repository<UserBonusAnswer>,
    ) { }

    @Get('bonus-data')
    async getBonusData() {
        const questions = await this.bonusQuestionRepository.find({
            order: { createdAt: 'DESC' },
            take: 10
        });

        const answers = await this.userBonusAnswerRepository.find({
            relations: ['user', 'question'],
            order: { createdAt: 'DESC' },
            take: 10
        });

        return {
            questions: questions.map(q => ({
                id: q.id,
                text: q.text,
                points: q.points,
                correctAnswer: q.correctAnswer,
                isActive: q.isActive,
                leagueId: q.leagueId,
                createdAt: q.createdAt
            })),
            answers: answers.map(a => ({
                id: a.id,
                answer: a.answer,
                pointsEarned: a.pointsEarned,
                userId: a.userId,
                questionId: a.questionId,
                questionText: a.question?.text,
                questionLeagueId: a.question?.leagueId,
                userName: a.user?.fullName,
                createdAt: a.createdAt
            }))
        };
    }
}
