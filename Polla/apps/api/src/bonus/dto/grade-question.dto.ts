import { IsString } from 'class-validator';

export class GradeQuestionDto {
  @IsString()
  correctAnswer: string;
}
