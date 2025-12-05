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
exports.LeagueParticipantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const league_participant_entity_1 = require("../database/entities/league-participant.entity");
const user_entity_1 = require("../database/entities/user.entity");
const league_entity_1 = require("../database/entities/league.entity");
const access_code_entity_1 = require("../database/entities/access-code.entity");
let LeagueParticipantsService = class LeagueParticipantsService {
    leagueParticipantRepository;
    userRepository;
    leagueRepository;
    accessCodeRepository;
    dataSource;
    constructor(leagueParticipantRepository, userRepository, leagueRepository, accessCodeRepository, dataSource) {
        this.leagueParticipantRepository = leagueParticipantRepository;
        this.userRepository = userRepository;
        this.leagueRepository = leagueRepository;
        this.accessCodeRepository = accessCodeRepository;
        this.dataSource = dataSource;
    }
    async joinLeague(userId, code) {
        console.log('joinLeague - userId:', userId, 'code:', code);
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new common_1.NotFoundException('User not found.');
            }
            const league = await this.leagueRepository.findOne({
                where: { accessCodePrefix: code },
                relations: ['participants', 'participants.user'],
            });
            if (!league) {
                throw new common_1.NotFoundException('Liga no encontrada. Verifica el código.');
            }
            console.log('joinLeague - Liga encontrada:', league.name, 'ID:', league.id);
            const isAlreadyParticipant = league.participants.some(p => p.user.id === userId);
            if (isAlreadyParticipant) {
                throw new common_1.ConflictException('Ya eres participante de esta liga.');
            }
            if (league.participants.length >= league.maxParticipants) {
                throw new common_1.BadRequestException('Liga llena (Máx 3 en plan Gratis). El dueño debe ampliar cupo.');
            }
            const leagueParticipant = this.leagueParticipantRepository.create({
                user: user,
                league: league,
                isAdmin: false,
            });
            const savedParticipant = await this.leagueParticipantRepository.save(leagueParticipant);
            console.log('joinLeague - Participante creado exitosamente');
            return savedParticipant;
        }
        catch (err) {
            console.error('joinLeague - Error:', err);
            throw err;
        }
    }
    async removeParticipant(leagueId, userIdToRemove, requesterId, requesterRole) {
        console.log(`🗑️ [removeParticipant] Liga: ${leagueId}, Remover: ${userIdToRemove}, Solicitante: ${requesterId}`);
        const league = await this.leagueRepository.findOne({
            where: { id: leagueId },
            relations: ['creator', 'participants', 'participants.user'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`Liga con ID ${leagueId} no encontrada`);
        }
        const isAdmin = league.creator.id === requesterId;
        const isSuperAdmin = requesterRole === 'SUPER_ADMIN';
        if (!isAdmin && !isSuperAdmin) {
            throw new common_1.BadRequestException('Solo el administrador de la liga puede expulsar participantes');
        }
        if (userIdToRemove === league.creator.id) {
            throw new common_1.BadRequestException('El administrador no puede ser expulsado de su propia liga');
        }
        const participant = league.participants.find(p => p.user.id === userIdToRemove);
        if (!participant) {
            throw new common_1.NotFoundException('El usuario no es participante de esta liga');
        }
        await this.leagueParticipantRepository.remove(participant);
        console.log(`✅ [removeParticipant] Usuario ${userIdToRemove} expulsado de la liga ${league.name}`);
        return {
            message: `Usuario expulsado exitosamente de la liga "${league.name}"`,
        };
    }
    async toggleBlockParticipant(leagueId, userIdToBlock, requesterId, requesterRole) {
        const league = await this.leagueRepository.findOne({
            where: { id: leagueId },
            relations: ['creator', 'participants', 'participants.user'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`Liga con ID ${leagueId} no encontrada`);
        }
        const isAdmin = league.creator.id === requesterId;
        const isSuperAdmin = requesterRole === 'SUPER_ADMIN';
        if (!isAdmin && !isSuperAdmin) {
            throw new common_1.BadRequestException('Solo el administrador de la liga puede bloquear participantes');
        }
        if (userIdToBlock === league.creator.id) {
            throw new common_1.BadRequestException('El administrador no puede ser bloqueado de su propia liga');
        }
        const participant = league.participants.find(p => p.user.id === userIdToBlock);
        if (!participant) {
            throw new common_1.NotFoundException('El usuario no es participante de esta liga');
        }
        participant.isBlocked = !participant.isBlocked;
        await this.leagueParticipantRepository.save(participant);
        return {
            message: `Usuario ${participant.isBlocked ? 'bloqueado' : 'desbloqueado'} exitosamente`,
            isBlocked: participant.isBlocked,
        };
    }
    async assignTriviaPoints(leagueId, userId, points, requesterId, requesterRole) {
        const league = await this.leagueRepository.findOne({
            where: { id: leagueId },
            relations: ['creator', 'participants', 'participants.user'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`Liga con ID ${leagueId} no encontrada`);
        }
        const isAdmin = league.creator.id === requesterId;
        const isSuperAdmin = requesterRole === 'SUPER_ADMIN';
        if (!isAdmin && !isSuperAdmin) {
            throw new common_1.BadRequestException('Solo el administrador de la liga puede asignar puntos de trivia');
        }
        const participant = league.participants.find(p => p.user.id === userId);
        if (!participant) {
            throw new common_1.NotFoundException('El usuario no es participante de esta liga');
        }
        participant.triviaPoints = (participant.triviaPoints || 0) + points;
        await this.leagueParticipantRepository.save(participant);
        return {
            message: `Se han asignado ${points} puntos de trivia a ${participant.user.nickname || participant.user.fullName}`,
            totalTriviaPoints: participant.triviaPoints,
        };
    }
};
exports.LeagueParticipantsService = LeagueParticipantsService;
exports.LeagueParticipantsService = LeagueParticipantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(league_participant_entity_1.LeagueParticipant)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(league_entity_1.League)),
    __param(3, (0, typeorm_1.InjectRepository)(access_code_entity_1.AccessCode)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], LeagueParticipantsService);
//# sourceMappingURL=league-participants.service.js.map