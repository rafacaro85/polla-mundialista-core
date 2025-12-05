import { IsString, IsNotEmpty } from 'class-validator';

export class JoinLeagueDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
