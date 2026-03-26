import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, Min, IsInt } from 'class-validator';

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
}
