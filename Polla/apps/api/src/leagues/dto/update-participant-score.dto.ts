import { IsNumber, IsOptional } from 'class-validator';

export class UpdateParticipantScoreDto {
  @IsNumber()
  @IsOptional()
  totalPoints?: number;

  @IsNumber()
  @IsOptional()
  triviaPoints?: number;

  @IsNumber()
  @IsOptional()
  predictionPoints?: number;

  @IsNumber()
  @IsOptional()
  bracketPoints?: number;

  @IsNumber()
  @IsOptional()
  jokerPoints?: number;
}
