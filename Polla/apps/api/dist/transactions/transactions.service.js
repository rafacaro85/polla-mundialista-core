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
const league_entity_1 = require("../database/entities/league.entity");
const transaction_status_enum_1 = require("../database/enums/transaction-status.enum");
let TransactionsService = class TransactionsService {
    transactionsRepository;
    leaguesRepository;
    dataSource;
    constructor(transactionsRepository, leaguesRepository, dataSource) {
        this.transactionsRepository = transactionsRepository;
        this.leaguesRepository = leaguesRepository;
        this.dataSource = dataSource;
    }
    async createTransaction(user, amount, packageId, leagueId, status = transaction_status_enum_1.TransactionStatus.PENDING) {
        const league = await this.leaguesRepository.findOne({ where: { id: leagueId } });
        if (!league) {
            throw new common_1.NotFoundException('Liga no encontrada');
        }
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
    async approveTransaction(id) {
        const transaction = await this.transactionsRepository.findOne({
            where: { id },
            relations: ['league'],
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transacción no encontrada');
        }
        if (transaction.status === transaction_status_enum_1.TransactionStatus.PAID) {
            return transaction;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            transaction.status = transaction_status_enum_1.TransactionStatus.PAID;
            await queryRunner.manager.save(transaction);
            if (transaction.league) {
                const league = transaction.league;
                let maxParticipants = 3;
                switch (transaction.packageId) {
                    case 'starter':
                        maxParticipants = 3;
                        break;
                    case 'amateur':
                        maxParticipants = 15;
                        break;
                    case 'semi-pro':
                        maxParticipants = 35;
                        break;
                    case 'pro':
                        maxParticipants = 60;
                        break;
                    case 'elite':
                        maxParticipants = 150;
                        break;
                    case 'legend':
                        maxParticipants = 300;
                        break;
                    default:
                        maxParticipants = league.maxParticipants;
                }
                league.maxParticipants = maxParticipants;
                league.packageType = transaction.packageId || 'starter';
                league.isPaid = true;
                await queryRunner.manager.save(league);
            }
            await queryRunner.commitTransaction();
            return transaction;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
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
    __param(1, (0, typeorm_1.InjectRepository)(league_entity_1.League)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map