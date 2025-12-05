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
exports.LeaguesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const league_entity_1 = require("../database/entities/league.entity");
const user_entity_1 = require("../database/entities/user.entity");
const league_participant_entity_1 = require("../database/entities/league-participant.entity");
const league_type_enum_1 = require("../database/enums/league-type.enum");
const league_status_enum_1 = require("../database/enums/league-status.enum");
const transactions_service_1 = require("../transactions/transactions.service");
const transaction_status_enum_1 = require("../database/enums/transaction-status.enum");
const pdf_service_1 = require("../common/pdf/pdf.service");
let LeaguesService = class LeaguesService {
    leaguesRepository;
    leagueParticipantsRepository;
    userRepository;
    transactionsService;
    pdfService;
    constructor(leaguesRepository, leagueParticipantsRepository, userRepository, transactionsService, pdfService) {
        this.leaguesRepository = leaguesRepository;
        this.leagueParticipantsRepository = leagueParticipantsRepository;
        this.userRepository = userRepository;
        this.transactionsService = transactionsService;
        this.pdfService = pdfService;
    }
    async createLeague(userId, createLeagueDto) {
        try {
            const { name, type, maxParticipants, accessCodePrefix, packageType } = createLeagueDto;
            if (packageType === 'starter' && maxParticipants > 3) {
                throw new common_1.BadRequestException('El plan Starter solo permite hasta 3 participantes.');
            }
            if (type === league_type_enum_1.LeagueType.VIP && maxParticipants > 5) {
                throw new common_1.BadRequestException('Las ligas VIP no pueden tener más de 5 participantes.');
            }
            const creator = await this.userRepository.findOne({ where: { id: userId } });
            if (!creator) {
                throw new common_1.NotFoundException(`User with ID ${userId} not found.`);
            }
            const code = accessCodePrefix || this.generateCode();
            const league = this.leaguesRepository.create({
                name,
                type,
                maxParticipants,
                creator,
                accessCodePrefix: code,
                isPaid: packageType !== 'starter',
            });
            const savedLeague = await this.leaguesRepository.save(league);
            if (packageType === 'starter') {
                await this.transactionsService.createTransaction(creator, 0, packageType, savedLeague.id, transaction_status_enum_1.TransactionStatus.PAID);
            }
            const participant = this.leagueParticipantsRepository.create({
                user: creator,
                league: savedLeague,
                isAdmin: true,
            });
            await this.leagueParticipantsRepository.save(participant);
            return savedLeague;
        }
        catch (error) {
            console.error('Error in createLeague:', error);
            throw new common_1.InternalServerErrorException('Failed to create league.', error.message);
        }
    }
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    async getMetadata(leagueId) {
        const league = await this.leaguesRepository.findOne({
            where: { id: leagueId },
            relations: ['participants'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`League with ID ${leagueId} not found.`);
        }
        const occupiedSlots = league.participants ? league.participants.length : 0;
        const availableSlots = league.maxParticipants - occupiedSlots;
        return { league, availableSlots: Math.max(0, availableSlots) };
    }
    async getLeagueByCode(code) {
        const league = await this.leaguesRepository.findOne({
            where: { accessCodePrefix: code },
            relations: ['creator'],
        });
        if (!league) {
            throw new common_1.NotFoundException('Liga no encontrada');
        }
        return {
            id: league.id,
            name: league.name,
            brandingLogoUrl: league.brandingLogoUrl,
            prizeImageUrl: league.prizeImageUrl,
            prizeDetails: league.prizeDetails,
            welcomeMessage: league.welcomeMessage,
            creatorName: league.creator.nickname || league.creator.fullName,
        };
    }
    async getGlobalRanking() {
        const ranking = await this.userRepository.createQueryBuilder('user')
            .leftJoin('user.predictions', 'prediction')
            .leftJoin('user_brackets', 'bracket', 'bracket.userId = user.id AND bracket.leagueId IS NULL')
            .leftJoin('user_bonus_answers', 'bonusAnswer', 'bonusAnswer.userId = user.id')
            .select('user.id', 'id')
            .addSelect('user.nickname', 'nickname')
            .addSelect('user.fullName', 'fullName')
            .addSelect('user.avatarUrl', 'avatarUrl')
            .addSelect('COALESCE(SUM(prediction.points), 0)', 'predictionPoints')
            .addSelect('COALESCE(MAX(bracket.points), 0)', 'bracketPoints')
            .addSelect('COALESCE(SUM(bonusAnswer.pointsEarned), 0)', 'bonusPoints')
            .addSelect('COALESCE(SUM(prediction.points), 0) + COALESCE(MAX(bracket.points), 0) + COALESCE(SUM(bonusAnswer.pointsEarned), 0)', 'totalPoints')
            .groupBy('user.id')
            .addGroupBy('user.nickname')
            .addGroupBy('user.fullName')
            .addGroupBy('user.avatarUrl')
            .orderBy('"totalPoints"', 'DESC')
            .getRawMany();
        return ranking.map((user, index) => ({
            position: index + 1,
            id: user.id,
            nickname: user.nickname || user.fullName.split(' ')[0],
            avatarUrl: user.avatarUrl,
            predictionPoints: Number(user.predictionPoints),
            bracketPoints: Number(user.bracketPoints),
            bonusPoints: Number(user.bonusPoints),
            totalPoints: Number(user.totalPoints),
        }));
    }
    async getMyLeagues(userId) {
        console.log('getMyLeagues - userId:', userId);
        const participants = await this.leagueParticipantsRepository.find({
            where: { user: { id: userId } },
            relations: ['league', 'league.creator'],
        });
        console.log('getMyLeagues - participants found:', participants.length);
        console.log('getMyLeagues - participants:', JSON.stringify(participants, null, 2));
        const result = participants.map(p => ({
            id: p.league.id,
            name: p.league.name,
            code: p.league.accessCodePrefix,
            isAdmin: p.isAdmin,
            creatorName: p.league.creator.nickname || p.league.creator.fullName,
            participantCount: 0,
        }));
        console.log('getMyLeagues - result:', JSON.stringify(result, null, 2));
        return result;
    }
    async getLeagueRanking(leagueId) {
        const participants = await this.leagueParticipantsRepository.find({
            where: { league: { id: leagueId } },
            relations: ['user'],
        });
        const userIds = participants.map(p => p.user.id);
        if (userIds.length === 0) {
            return [];
        }
        const ranking = await this.userRepository.createQueryBuilder('user')
            .leftJoin('user.predictions', 'prediction')
            .leftJoin('user_brackets', 'bracket', 'bracket.userId = user.id AND (bracket.leagueId = :leagueId OR bracket.leagueId IS NULL)', { leagueId })
            .leftJoin('user_bonus_answers', 'bonusAnswer', 'bonusAnswer.userId = user.id')
            .leftJoin('league_participants', 'lp', 'lp.userId = user.id AND lp.leagueId = :leagueId', { leagueId })
            .select('user.id', 'id')
            .addSelect('user.nickname', 'nickname')
            .addSelect('user.fullName', 'fullName')
            .addSelect('user.avatarUrl', 'avatarUrl')
            .addSelect('COALESCE(SUM(prediction.points), 0)', 'predictionPoints')
            .addSelect('COALESCE(MAX(bracket.points), 0)', 'bracketPoints')
            .addSelect('COALESCE(SUM(bonusAnswer.pointsEarned), 0)', 'bonusPoints')
            .addSelect('COALESCE(MAX(lp.trivia_points), 0)', 'triviaPoints')
            .addSelect('COALESCE(SUM(prediction.points), 0) + COALESCE(MAX(bracket.points), 0) + COALESCE(SUM(bonusAnswer.pointsEarned), 0) + COALESCE(MAX(lp.trivia_points), 0)', 'totalPoints')
            .where('user.id IN (:...userIds)', { userIds })
            .groupBy('user.id')
            .addGroupBy('user.nickname')
            .addGroupBy('user.fullName')
            .addGroupBy('user.avatarUrl')
            .orderBy('"totalPoints"', 'DESC')
            .getRawMany();
        return ranking.map((user, index) => ({
            position: index + 1,
            id: user.id,
            nickname: user.nickname || user.fullName.split(' ')[0],
            avatarUrl: user.avatarUrl,
            predictionPoints: Number(user.predictionPoints),
            bracketPoints: Number(user.bracketPoints),
            bonusPoints: Number(user.bonusPoints),
            triviaPoints: Number(user.triviaPoints),
            totalPoints: Number(user.totalPoints),
        }));
    }
    async getAllLeagues() {
        const leagues = await this.leaguesRepository.find({
            relations: ['creator', 'participants'],
        });
        return leagues.map(league => ({
            id: league.id,
            name: league.name,
            code: league.accessCodePrefix,
            type: league.type,
            maxParticipants: league.maxParticipants,
            creator: {
                id: league.creator.id,
                nickname: league.creator.nickname || league.creator.fullName,
                avatarUrl: league.creator.avatarUrl,
            },
            participantCount: league.participants?.length || 0,
            brandingLogoUrl: league.brandingLogoUrl,
            prizeImageUrl: league.prizeImageUrl,
            prizeDetails: league.prizeDetails,
            welcomeMessage: league.welcomeMessage,
        }));
    }
    async updateLeague(leagueId, userId, updateLeagueDto, userRole) {
        const league = await this.leaguesRepository.findOne({
            where: { id: leagueId },
            relations: ['creator'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`Liga con ID ${leagueId} no encontrada`);
        }
        if (userRole !== 'SUPER_ADMIN' && league.creator.id !== userId) {
            throw new common_1.ForbiddenException('No tienes permisos para editar esta liga');
        }
        if (updateLeagueDto.name) {
            league.name = updateLeagueDto.name;
        }
        if (updateLeagueDto.maxParticipants !== undefined) {
            if (userRole !== 'SUPER_ADMIN') {
                throw new common_1.ForbiddenException('Solo el SUPER_ADMIN puede modificar el límite de participantes');
            }
            league.maxParticipants = updateLeagueDto.maxParticipants;
        }
        if (updateLeagueDto.brandingLogoUrl !== undefined)
            league.brandingLogoUrl = updateLeagueDto.brandingLogoUrl;
        if (updateLeagueDto.prizeImageUrl !== undefined)
            league.prizeImageUrl = updateLeagueDto.prizeImageUrl;
        if (updateLeagueDto.prizeDetails !== undefined)
            league.prizeDetails = updateLeagueDto.prizeDetails;
        if (updateLeagueDto.welcomeMessage !== undefined)
            league.welcomeMessage = updateLeagueDto.welcomeMessage;
        const updatedLeague = await this.leaguesRepository.save(league);
        console.log(`✅ [updateLeague] Liga actualizada: ${updatedLeague.name}`);
        return updatedLeague;
    }
    async transferOwner(leagueId, requesterId, newAdminId, requesterRole) {
        const league = await this.leaguesRepository.findOne({
            where: { id: leagueId },
            relations: ['creator', 'participants', 'participants.user'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`Liga con ID ${leagueId} no encontrada`);
        }
        if (requesterRole !== 'SUPER_ADMIN' && league.creator.id !== requesterId) {
            throw new common_1.ForbiddenException('Solo el SUPER_ADMIN o el admin actual pueden transferir la propiedad');
        }
        const newAdminParticipant = league.participants.find(p => p.user.id === newAdminId);
        if (!newAdminParticipant) {
            throw new common_1.BadRequestException('El nuevo administrador debe ser un participante de la liga');
        }
        const newAdmin = await this.userRepository.findOne({ where: { id: newAdminId } });
        if (!newAdmin) {
            throw new common_1.NotFoundException(`Usuario con ID ${newAdminId} no encontrado`);
        }
        const oldAdminId = league.creator.id;
        league.creator = newAdmin;
        await this.leaguesRepository.save(league);
        const oldAdminParticipant = league.participants.find(p => p.user.id === oldAdminId);
        if (oldAdminParticipant) {
            oldAdminParticipant.isAdmin = false;
            await this.leagueParticipantsRepository.save(oldAdminParticipant);
        }
        newAdminParticipant.isAdmin = true;
        await this.leagueParticipantsRepository.save(newAdminParticipant);
        console.log(`✅ [transferOwner] Propiedad transferida de ${oldAdminId} a ${newAdminId}`);
        return {
            ...league,
            message: `Propiedad transferida exitosamente a ${newAdmin.nickname || newAdmin.fullName}`,
        };
    }
    async deleteLeague(leagueId, userId, userRole) {
        const league = await this.leaguesRepository.findOne({
            where: { id: leagueId },
            relations: ['creator'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`Liga con ID ${leagueId} no encontrada`);
        }
        console.log(`🔍 [deleteLeague] Verificando permisos...`);
        console.log(`   Creator ID: ${league.creator.id}`);
        console.log(`   Requester ID: ${userId}`);
        console.log(`   Requester Role: ${userRole}`);
        if (userRole !== 'SUPER_ADMIN' && league.creator.id !== userId) {
            console.error(`❌ [deleteLeague] Permiso denegado.`);
            throw new common_1.ForbiddenException('No tienes permisos para eliminar esta liga');
        }
        await this.leaguesRepository.remove(league);
        return { message: 'Liga eliminada correctamente' };
    }
    async toggleBlockStatus(leagueId, userId, userRole) {
        const league = await this.leaguesRepository.findOne({
            where: { id: leagueId },
            relations: ['creator'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`Liga con ID ${leagueId} no encontrada`);
        }
        if (userRole !== 'SUPER_ADMIN' && league.creator.id !== userId) {
            throw new common_1.ForbiddenException('No tienes permisos para bloquear/desbloquear esta liga');
        }
        if (league.status === league_status_enum_1.LeagueStatus.LOCKED) {
            league.status = league_status_enum_1.LeagueStatus.ACTIVE;
        }
        else {
            league.status = league_status_enum_1.LeagueStatus.LOCKED;
        }
        await this.leaguesRepository.save(league);
        return league;
    }
    async getLeagueVoucher(leagueId) {
        const transaction = await this.transactionsService.findByLeagueId(leagueId);
        if (!transaction) {
            throw new common_1.NotFoundException('No se encontró una transacción para esta liga');
        }
        if (!transaction.user || !transaction.league) {
            throw new common_1.NotFoundException('Datos de transacción incompletos');
        }
        return this.pdfService.generateVoucher(transaction, transaction.user, transaction.league);
    }
};
exports.LeaguesService = LeaguesService;
exports.LeaguesService = LeaguesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(league_entity_1.League)),
    __param(1, (0, typeorm_1.InjectRepository)(league_participant_entity_1.LeagueParticipant)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        transactions_service_1.TransactionsService,
        pdf_service_1.PdfService])
], LeaguesService);
//# sourceMappingURL=leagues.service.js.map