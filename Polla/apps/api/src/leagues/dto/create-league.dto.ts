import { IsString, IsNotEmpty, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { LeagueType } from '../../database/enums/league-type.enum';

export class CreateLeagueDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(LeagueType)
  @IsNotEmpty()
  type: LeagueType;

  @IsInt()
  @Min(1)
  @Max(1000) // Assuming a reasonable max, adjust as needed
  maxParticipants: number;

  @IsString()
  @IsNotEmpty()
  accessCodePrefix: string; // For VIP leagues

  @IsString()
  @IsNotEmpty()
  packageType: string;

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
