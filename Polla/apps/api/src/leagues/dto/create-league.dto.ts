import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsHexColor,
  IsIn,
} from 'class-validator';
import { LeagueType } from '../../database/enums/league-type.enum';

export class CreateLeagueDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede exceder 80 caracteres' })
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
  @MaxLength(20)
  accessCodePrefix?: string;

  @IsString()
  @IsOptional()
  @IsIn(['WC2026', 'UCL2526'], { message: 'tournamentId inválido' })
  tournamentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  packageType: string;

  @IsString()
  @IsOptional()
  brandingLogoUrl?: string;

  @IsString()
  @IsOptional()
  prizeImageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  prizeDetails?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  welcomeMessage?: string;

  // --- ENTERPRISE ---
  @IsBoolean()
  @IsOptional()
  isEnterprise?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  companyName?: string;

  @IsHexColor()
  @IsOptional()
  brandColorPrimary?: string;

  @IsHexColor()
  @IsOptional()
  brandColorSecondary?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  adminName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  adminPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  adminEmail?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100)
  adminPassword?: string;

  @IsBoolean()
  @IsOptional()
  showTableNumbers?: boolean;
}


