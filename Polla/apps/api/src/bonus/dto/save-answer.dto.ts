import { IsString, IsUUID } from 'class-validator';

export class SaveAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  answer: string;
}
