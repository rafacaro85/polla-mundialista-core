import { Repository } from 'typeorm';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { GradeQuestionDto } from './dto/grade-question.dto';
import { League } from '../database/entities/league.entity';
export declare class BonusService {
    private bonusQuestionRepository;
    private userBonusAnswerRepository;
    private leagueRepository;
    constructor(bonusQuestionRepository: Repository<BonusQuestion>, userBonusAnswerRepository: Repository<UserBonusAnswer>, leagueRepository: Repository<League>);
    createQuestion(dto: CreateQuestionDto): Promise<BonusQuestion>;
    getActiveQuestions(): Promise<BonusQuestion[]>;
    getAllQuestions(): Promise<BonusQuestion[]>;
    saveAnswer(userId: string, dto: SaveAnswerDto): Promise<UserBonusAnswer>;
    getUserAnswers(userId: string): Promise<UserBonusAnswer[]>;
    gradeQuestion(questionId: string, dto: GradeQuestionDto): Promise<{
        updated: number;
    }>;
    private calculatePoints;
    deleteQuestion(questionId: string): Promise<void>;
    updateQuestion(questionId: string, dto: CreateQuestionDto): Promise<BonusQuestion>;
}
