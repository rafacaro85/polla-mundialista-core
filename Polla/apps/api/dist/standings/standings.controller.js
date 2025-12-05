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
exports.StandingsController = void 0;
const common_1 = require("@nestjs/common");
const standings_service_1 = require("./standings.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let StandingsController = class StandingsController {
    standingsService;
    constructor(standingsService) {
        this.standingsService = standingsService;
    }
    async getGroupStandings(group) {
        return this.standingsService.calculateGroupStandings(group);
    }
    async getAllStandings() {
        return this.standingsService.getAllGroupStandings();
    }
};
exports.StandingsController = StandingsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('group/:group'),
    __param(0, (0, common_1.Param)('group')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StandingsController.prototype, "getGroupStandings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StandingsController.prototype, "getAllStandings", null);
exports.StandingsController = StandingsController = __decorate([
    (0, common_1.Controller)('standings'),
    __metadata("design:paramtypes", [standings_service_1.StandingsService])
], StandingsController);
//# sourceMappingURL=standings.controller.js.map