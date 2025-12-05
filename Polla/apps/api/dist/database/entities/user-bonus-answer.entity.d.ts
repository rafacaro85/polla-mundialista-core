import { User } from './user.entity';
import { BonusQuestion } from './bonus-question.entity';
export declare class UserBonusAnswer {
    id: string;
    user: User;
    userId: string;
    question: BonusQuestion;
    questionId: string;
    answer: string;
    pointsEarned: number;
    createdAt: Date;
    updatedAt: Date;
}
