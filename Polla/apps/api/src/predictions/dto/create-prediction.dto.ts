import { IsNumber, IsInt, Min, Max, IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreatePredictionDto {
  @IsUUID()
  matchId: string;

  @IsInt()
  @Min(0)
  @Max(20)
  homeScore: number;

  @IsInt()
  @Min(0)
  @Max(20)
  awayScore: number;

  @IsUUID()
  @IsOptional()
  leagueId?: string;

  @IsBoolean()
  @IsOptional()
  isJoker?: boolean;

  @IsString()
  @IsOptional()
  phase?: string;
}

