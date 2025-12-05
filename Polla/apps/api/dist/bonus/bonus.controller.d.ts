import { BonusService } from './bonus.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { GradeQuestionDto } from './dto/grade-question.dto';
export declare class BonusController {
    private readonly bonusService;
    constructor(bonusService: BonusService);
    createQuestion(dto: CreateQuestionDto): Promise<import("../database/entities/bonus-question.entity").BonusQuestion>;
    getActiveQuestions(): Promise<import("../database/entities/bonus-question.entity").BonusQuestion[]>;
    getAllQuestions(): Promise<import("../database/entities/bonus-question.entity").BonusQuestion[]>;
    saveAnswer(req: any, dto: SaveAnswerDto): Promise<import("../database/entities/user-bonus-answer.entity").UserBonusAnswer>;
    getMyAnswers(req: any): Promise<import("../database/entities/user-bonus-answer.entity").UserBonusAnswer[]>;
    gradeQuestion(questionId: string, dto: GradeQuestionDto): Promise<{
        updated: number;
    }>;
    deleteQuestion(questionId: string): Promise<{
        message: string;
    }>;
    updateQuestion(questionId: string, dto: CreateQuestionDto): Promise<import("../database/entities/bonus-question.entity").BonusQuestion>;
}
