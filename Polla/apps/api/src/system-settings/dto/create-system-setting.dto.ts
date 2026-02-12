import { IsOptional, IsString } from 'class-validator';

export class CreateSystemSettingDto {
  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  @IsOptional()
  @IsString()
  support?: string;

  @IsOptional()
  @IsString()
  copyright?: string;

  @IsOptional()
  @IsString()
  termsUrl?: string;

  @IsOptional()
  @IsString()
  privacyUrl?: string;
}
