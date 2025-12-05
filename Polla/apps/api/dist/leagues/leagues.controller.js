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
exports.LeaguesController = void 0;
const common_1 = require("@nestjs/common");
const leagues_service_1 = require("./leagues.service");
const create_league_dto_1 = require("./dto/create-league.dto");
const update_league_dto_1 = require("./dto/update-league.dto");
const transfer_owner_dto_1 = require("./dto/transfer-owner.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const access_codes_service_1 = require("../access-codes/access-codes.service");
const league_participants_service_1 = require("../league-participants/league-participants.service");
const generate_access_codes_dto_1 = require("./dto/generate-access-codes.dto");
const join_league_dto_1 = require("./dto/join-league.dto");
let LeaguesController = class LeaguesController {
    leaguesService;
    accessCodesService;
    leagueParticipantsService;
    constructor(leaguesService, accessCodesService, leagueParticipantsService) {
        this.leaguesService = leaguesService;
        this.accessCodesService = accessCodesService;
        this.leagueParticipantsService = leagueParticipantsService;
    }
    async createLeague(req, createLeagueDto) {
        console.log('req.user:', req.user);
        const userPayload = req.user;
        const userId = userPayload.userId || userPayload.id;
        if (!userId) {
            throw new common_1.InternalServerErrorException('User ID not found in request after authentication.');
        }
        return this.leaguesService.createLeague(userId, createLeagueDto);
    }
    async getGlobalRanking() {
        return this.leaguesService.getGlobalRanking();
    }
    async getMyLeagues(req) {
        const userPayload = req.user;
        const userId = userPayload.userId || userPayload.id;
        if (!userId) {
            throw new common_1.InternalServerErrorException('User ID not found in request after authentication.');
        }
        return this.leaguesService.getMyLeagues(userId);
    }
    async getLeagueMetadata(leagueId) {
        return this.leaguesService.getMetadata(leagueId);
    }
    async previewLeague(code) {
        return this.leaguesService.getLeagueByCode(code);
    }
    async getLeagueRanking(leagueId) {
        return this.leaguesService.getLeagueRanking(leagueId);
    }
    async getLeagueVoucher(leagueId, res) {
        const buffer = await this.leaguesService.getLeagueVoucher(leagueId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=voucher-${leagueId}.pdf`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async generateCodes(leagueId, generateAccessCodesDto, req) {
        return this.accessCodesService.generateCodes(leagueId, generateAccessCodesDto.quantity);
    }
    async getAllLeagues() {
        console.log('📋 [GET /leagues/all] Listando todas las ligas...');
        return this.leaguesService.getAllLeagues();
    }
    async updateLeague(leagueId, updateLeagueDto, req) {
        const userPayload = req.user;
        const userId = userPayload.id;
        console.log(`✏️ [PATCH /leagues/${leagueId}] Actualizando liga...`);
        console.log(`   Usuario: ${userId} | Rol: ${userPayload.role}`);
        return this.leaguesService.updateLeague(leagueId, userId, updateLeagueDto, userPayload.role);
    }
    async toggleBlockStatus(leagueId, req) {
        const userPayload = req.user;
        return this.leaguesService.toggleBlockStatus(leagueId, userPayload.id, userPayload.role);
    }
    async deleteLeague(leagueId, req) {
        const userPayload = req.user;
        const userId = userPayload.userId || userPayload.id;
        console.log(`🗑️ [DELETE /leagues/${leagueId}] Eliminando liga...`);
        console.log(`   Solicitante: ${userId} | Rol: ${userPayload.role}`);
        return this.leaguesService.deleteLeague(leagueId, userId, userPayload.role);
    }
    async transferOwner(leagueId, transferOwnerDto, req) {
        const userPayload = req.user;
        const userId = userPayload.id;
        console.log(`🔄 [PATCH /leagues/${leagueId}/transfer-owner] Transfiriendo propiedad...`);
        console.log(`   Solicitante: ${userId} | Rol: ${userPayload.role}`);
        console.log(`   Nuevo admin: ${transferOwnerDto.newAdminId}`);
        return this.leaguesService.transferOwner(leagueId, userId, transferOwnerDto.newAdminId, userPayload.role);
    }
    async removeParticipant(leagueId, userId, req) {
        const userPayload = req.user;
        const requesterId = userPayload.id;
        console.log(`🗑️ [DELETE /leagues/${leagueId}/participants/${userId}] Expulsando participante...`);
        console.log(`   Solicitante: ${requesterId} | Rol: ${userPayload.role}`);
        return this.leagueParticipantsService.removeParticipant(leagueId, userId, requesterId, userPayload.role);
    }
    async toggleBlockParticipant(leagueId, userId, req) {
        const userPayload = req.user;
        const requesterId = userPayload.id;
        console.log(`🔒 [PATCH /leagues/${leagueId}/participants/${userId}/toggle-block] Bloqueando/Desbloqueando participante...`);
        return this.leagueParticipantsService.toggleBlockParticipant(leagueId, userId, requesterId, userPayload.role);
    }
    async joinLeague(req, joinLeagueDto) {
        const userPayload = req.user;
        const userId = userPayload.userId || userPayload.id;
        if (!userId) {
            throw new common_1.InternalServerErrorException('User ID not found in request after authentication.');
        }
        return this.leagueParticipantsService.joinLeague(userId, joinLeagueDto.code);
    }
};
exports.LeaguesController = LeaguesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_league_dto_1.CreateLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "createLeague", null);
__decorate([
    (0, common_1.Get)('global/ranking'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getGlobalRanking", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getMyLeagues", null);
__decorate([
    (0, common_1.Get)(':id/metadata'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getLeagueMetadata", null);
__decorate([
    (0, common_1.Get)('preview/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "previewLeague", null);
__decorate([
    (0, common_1.Get)(':id/ranking'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getLeagueRanking", null);
__decorate([
    (0, common_1.Get)(':id/voucher'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getLeagueVoucher", null);
__decorate([
    (0, common_1.Post)(':id/codes'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_access_codes_dto_1.GenerateAccessCodesDto, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "generateCodes", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'ADMIN'),
    (0, common_1.Get)('all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "getAllLeagues", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_league_dto_1.UpdateLeagueDto, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "updateLeague", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/toggle-block'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "toggleBlockStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "deleteLeague", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id/transfer-owner'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transfer_owner_dto_1.TransferOwnerDto, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "transferOwner", null);
__decorate([
    (0, common_1.Delete)(':leagueId/participants/:userId'),
    __param(0, (0, common_1.Param)('leagueId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "removeParticipant", null);
__decorate([
    (0, common_1.Patch)(':leagueId/participants/:userId/toggle-block'),
    __param(0, (0, common_1.Param)('leagueId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "toggleBlockParticipant", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, join_league_dto_1.JoinLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "joinLeague", null);
exports.LeaguesController = LeaguesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('leagues'),
    __metadata("design:paramtypes", [leagues_service_1.LeaguesService,
        access_codes_service_1.AccessCodesService,
        league_participants_service_1.LeagueParticipantsService])
], LeaguesController);
//# sourceMappingURL=leagues.controller.js.map