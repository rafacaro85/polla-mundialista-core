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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("../database/entities/transaction.entity");
const transaction_status_enum_1 = require("../database/enums/transaction-status.enum");
let TransactionsService = class TransactionsService {
    transactionsRepository;
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async createTransaction(user, amount, packageId, league, status = transaction_status_enum_1.TransactionStatus.PENDING) {
        const transaction = this.transactionsRepository.create({
            user,
            amount,
            packageId,
            league,
            status,
            referenceCode: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        });
        return this.transactionsRepository.save(transaction);
    }
    async findOne(id) {
        return this.transactionsRepository.findOne({
            where: { id },
            relations: ['user', 'league'],
        });
    }
    async findByLeagueId(leagueId) {
        return this.transactionsRepository.findOne({
            where: { league: { id: leagueId } },
            relations: ['user', 'league'],
            order: { createdAt: 'DESC' },
        });
    }
    async findAll() {
        return this.transactionsRepository.find({
            relations: ['user', 'league'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map