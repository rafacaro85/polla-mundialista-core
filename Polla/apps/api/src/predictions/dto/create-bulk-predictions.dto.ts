import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePredictionDto } from './create-prediction.dto';

export class CreateBulkPredictionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePredictionDto)
  predictions: CreatePredictionDto[];
}
