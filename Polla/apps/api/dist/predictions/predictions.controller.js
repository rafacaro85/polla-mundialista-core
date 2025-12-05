"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsController = void 0;
const common_1 = require("@nestjs/common");
const predictions_service_1 = require("./predictions.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_prediction_dto_1 = require("./dto/create-prediction.dto");
let PredictionsController = class PredictionsController {
    predictionsService;
    constructor(predictionsService) {
        this.predictionsService = predictionsService;
    }
    async upsertPrediction(req, body) {
        try {
            console.log('Upserting prediction for user:', req.user.id, 'match:', body.matchId);
            return await this.predictionsService.upsertPrediction(req.user.id, body.matchId, body.homeScore, body.awayScore, body.leagueId);
        }
        catch (error) {
            console.error('Error upserting prediction:', error);
            throw error;
        }
    }
    async getMyPredictions(req) {
        return this.predictionsService.findAllByUser(req.user.id);
    }
};
exports.PredictionsController = PredictionsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_prediction_dto_1.CreatePredictionDto]),
    __metadata("design:returntype", Promise)
], PredictionsController.prototype, "upsertPrediction", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PredictionsController.prototype, "getMyPredictions", null);
exports.PredictionsController = PredictionsController = __decorate([
    (0, common_1.Controller)('predictions'),
    __metadata("design:paramtypes", [predictions_service_1.PredictionsService])
], PredictionsController);
//# sourceMappingURL=predictions.controller.js.map