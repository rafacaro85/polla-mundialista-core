import { PredictionsService } from './predictions.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
export declare class PredictionsController {
    private readonly predictionsService;
    constructor(predictionsService: PredictionsService);
    upsertPrediction(req: any, body: CreatePredictionDto): Promise<import("../database/entities/prediction.entity").Prediction>;
    getMyPredictions(req: any): Promise<import("../database/entities/prediction.entity").Prediction[]>;
}
