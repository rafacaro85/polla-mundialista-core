import { IsNumber, Min } from 'class-validator';

export class UpdateTieBreakerDto {
    @IsNumber()
    @Min(0)
    guess: number;
}
