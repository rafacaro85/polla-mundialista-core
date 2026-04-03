import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, Min, IsBoolean } from 'class-validator';

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export class CreateTransactionDto {
  @IsUUID()
  leagueId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(TransactionType, { message: 'Tipo de transacción inválido' })
  @IsOptional()
  type?: TransactionType;

  @IsString()
  @IsOptional()
  packageId?: string;

  @IsString()
  @IsOptional()
  referenceCode?: string;

  @IsBoolean()
  @IsOptional()
  isUpgrade?: boolean;

  @IsString()
  @IsOptional()
  upgradePlan?: string;

  @IsString()
  @IsOptional()
  currentPlan?: string;
}
