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

    @IsString()
    @IsOptional()
    brandColorBg?: string;

    @IsString()
    @IsOptional()
    brandColorText?: string;

    @IsString()
    @IsOptional()
    brandFontFamily?: string;

    @IsString()
    @IsOptional()
    brandCoverUrl?: string;

    @IsBoolean()
    @IsOptional()
    isEnterpriseActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isPaid?: boolean;

    @IsBoolean()
    @IsOptional()
    enableDepartmentWar?: boolean;

    // --- SOCIAL MEDIA ---
    @IsString() @IsOptional() socialInstagram?: string;
    @IsString() @IsOptional() socialFacebook?: string;
    @IsString() @IsOptional() socialWhatsapp?: string;
    @IsString() @IsOptional() socialYoutube?: string;
    @IsString() @IsOptional() socialTiktok?: string;
    @IsString() @IsOptional() socialLinkedin?: string;
    @IsString() @IsOptional() socialWebsite?: string;
}
