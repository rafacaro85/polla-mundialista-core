import { IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  matchId: string;

  @IsNumber()
  @Min(0)
  homeScore: number;

  @IsNumber()
  @Min(0)
  awayScore: number;

  @IsString()
  @IsOptional()
  leagueId?: string;

  @IsOptional()
  isJoker?: boolean;
}
