import { IsString, IsOptional, IsNumber, IsBoolean, IsHexColor } from 'class-validator';

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

    @IsBoolean()
    @IsOptional()
    isEnterpriseActive?: boolean;
}
