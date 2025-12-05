import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateLeagueDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    maxParticipants?: number;

    @IsString()
    @IsOptional()
    brandingLogoUrl?: string;

    @IsString()
    @IsOptional()
    prizeImageUrl?: string;

    @IsString()
    @IsOptional()
    prizeDetails?: string;

    @IsString()
    @IsOptional()
    welcomeMessage?: string;
}
