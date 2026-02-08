import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsHexColor,
} from 'class-validator';
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
  @Max(10000)
  maxParticipants: number;

  @IsString()
  @IsOptional()
  accessCodePrefix?: string;

  @IsString()
  @IsOptional()
  tournamentId?: string;

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

  // --- ENTERPRISE ---
  @IsBoolean()
  @IsOptional()
  isEnterprise?: boolean;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsHexColor()
  @IsOptional()
  brandColorPrimary?: string;

  @IsHexColor()
  @IsOptional()
  brandColorSecondary?: string;

  @IsString()
  @IsOptional()
  adminName?: string;

  @IsString()
  @IsOptional()
  adminPhone?: string;

  @IsString()
  @IsOptional()
  adminEmail?: string;

  @IsString()
  @IsOptional()
  adminPassword?: string;
}
