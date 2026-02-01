import { IsNumber, IsString, IsOptional, Min, IsIn } from 'class-validator';

export class CreateSignatureDto {
  @IsNumber()
  @Min(1000, { message: 'El monto mínimo es $1,000 COP' })
  amount: number;

  @IsString()
  @IsIn(['COP'], { message: 'Solo se acepta moneda COP' })
  currency: string;

  @IsOptional()
  @IsString()
  leagueId?: string;

  @IsOptional()
  @IsString()
  packageId?: string;
}
