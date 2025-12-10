import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class JoinLeagueDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  department?: string;
}
