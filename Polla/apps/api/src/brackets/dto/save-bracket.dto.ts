import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SaveBracketDto {
    @IsNotEmpty()
    @IsObject()
    picks: Record<string, string>; // matchId -> teamName

    @IsOptional()
    @IsString()
    leagueId?: string;
}
