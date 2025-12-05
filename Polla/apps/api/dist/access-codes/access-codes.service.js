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
exports.AccessCodesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const access_code_entity_1 = require("../database/entities/access-code.entity");
const league_entity_1 = require("../database/entities/league.entity");
const access_code_status_enum_1 = require("../database/enums/access-code-status.enum");
let AccessCodesService = class AccessCodesService {
    accessCodeRepository;
    leagueRepository;
    constructor(accessCodeRepository, leagueRepository) {
        this.accessCodeRepository = accessCodeRepository;
        this.leagueRepository = leagueRepository;
    }
    async generateCodes(leagueId, quantity) {
        const league = await this.leagueRepository.findOne({ where: { id: leagueId } });
        if (!league) {
            throw new common_1.NotFoundException(`League with ID ${leagueId} not found.`);
        }
        const actualPrefix = league.accessCodePrefix || league.id.substring(0, 8).toUpperCase();
        const generatedCodes = [];
        for (let i = 0; i < quantity; i++) {
            const uniqueRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
            const code = `${actualPrefix}-${uniqueRandom}`;
            const accessCode = this.accessCodeRepository.create({
                code,
                league,
                status: access_code_status_enum_1.AccessCodeStatus.AVAILABLE,
            });
            generatedCodes.push(accessCode);
        }
        return this.accessCodeRepository.save(generatedCodes);
    }
    async validateCode(code) {
        const accessCode = await this.accessCodeRepository.findOne({
            where: { code, status: access_code_status_enum_1.AccessCodeStatus.AVAILABLE },
            relations: ['league'],
        });
        if (!accessCode) {
            throw new common_1.BadRequestException('Invalid or used access code.');
        }
        return accessCode;
    }
};
exports.AccessCodesService = AccessCodesService;
exports.AccessCodesService = AccessCodesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(access_code_entity_1.AccessCode)),
    __param(1, (0, typeorm_1.InjectRepository)(league_entity_1.League)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AccessCodesService);
//# sourceMappingURL=access-codes.service.js.map