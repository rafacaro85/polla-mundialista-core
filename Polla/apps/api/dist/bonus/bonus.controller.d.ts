import { BonusService } from './bonus.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { GradeQuestionDto } from './dto/grade-question.dto';
export declare class BonusController {
    private readonly bonusService;
    constructor(bonusService: BonusService);
    createQuestion(dto: CreateQuestionDto): unknown;
    getActiveQuestions(): unknown;
    getAllQuestions(): unknown;
    saveAnswer(req: any, dto: SaveAnswerDto): unknown;
    getMyAnswers(req: any): unknown;
    gradeQuestion(questionId: string, dto: GradeQuestionDto): unknown;
    deleteQuestion(questionId: string): unknown;
    updateQuestion(questionId: string, dto: CreateQuestionDto): unknown;
}
