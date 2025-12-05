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
exports.BracketsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const brackets_service_1 = require("./brackets.service");
const save_bracket_dto_1 = require("./dto/save-bracket.dto");
let BracketsController = class BracketsController {
    bracketsService;
    constructor(bracketsService) {
        this.bracketsService = bracketsService;
    }
    async saveBracket(req, dto) {
        const userId = req.user.id;
        return this.bracketsService.saveBracket(userId, dto);
    }
    async getMyBracket(req) {
        const userId = req.user.id;
        return this.bracketsService.getMyBracket(userId);
    }
    async getMyBracketForLeague(req, leagueId) {
        const userId = req.user.id;
        return this.bracketsService.getMyBracket(userId, leagueId);
    }
    async clearMyBracket(req) {
        const userId = req.user.id;
        await this.bracketsService.clearBracket(userId);
        return { success: true, message: 'Bracket eliminado exitosamente' };
    }
    async recalculatePoints() {
        await this.bracketsService.recalculateAllBracketPoints();
        return { message: 'Bracket points recalculated successfully' };
    }
};
exports.BracketsController = BracketsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, save_bracket_dto_1.SaveBracketDto]),
    __metadata("design:returntype", Promise)
], BracketsController.prototype, "saveBracket", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BracketsController.prototype, "getMyBracket", null);
__decorate([
    (0, common_1.Get)('my/:leagueId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('leagueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BracketsController.prototype, "getMyBracketForLeague", null);
__decorate([
    (0, common_1.Delete)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BracketsController.prototype, "clearMyBracket", null);
__decorate([
    (0, common_1.Post)('recalculate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BracketsController.prototype, "recalculatePoints", null);
exports.BracketsController = BracketsController = __decorate([
    (0, common_1.Controller)('brackets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [brackets_service_1.BracketsService])
], BracketsController);
//# sourceMappingURL=brackets.controller.js.map