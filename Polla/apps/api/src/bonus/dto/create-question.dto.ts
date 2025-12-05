import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateQuestionDto {
    @IsString()
    text: string;

    @IsNumber()
    @Min(1)
    points: number;

    @IsOptional()
    @IsString()
    leagueId?: string;
}
