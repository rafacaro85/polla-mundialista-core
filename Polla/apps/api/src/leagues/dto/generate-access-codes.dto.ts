import { IsInt, Min, IsNotEmpty, IsString } from 'class-validator';

export class GenerateAccessCodesDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  prefix: string;
}
