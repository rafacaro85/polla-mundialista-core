import { IsString, IsNumber, Min, IsOptional, IsArray } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    text: string;

    @IsNumber()
    @Min(1)
    points: number;

    @IsOptional()
    @IsString()
    leagueId?: string;

    @IsOptional()
    @IsString()
    tournamentId?: string;

    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    type?: 'OPEN' | 'MULTIPLE';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];
}
