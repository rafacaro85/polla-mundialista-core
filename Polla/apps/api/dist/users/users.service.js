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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../database/entities/user.entity");
const user_role_enum_1 = require("../database/enums/user-role.enum");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findAll() {
        return this.usersRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async create(email, fullName, password, googleId, avatarUrl, phoneNumber) {
        const newUser = this.usersRepository.create({
            email,
            fullName,
            password,
            googleId,
            avatarUrl,
            phoneNumber,
            role: user_role_enum_1.UserRole.PLAYER,
        });
        return this.usersRepository.save(newUser);
    }
    async update(user, updates) {
        Object.assign(user, updates);
        return this.usersRepository.save(user);
    }
    async updateProfile(userId, updates) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updates.nickname)
            user.nickname = updates.nickname;
        if (updates.fullName)
            user.fullName = updates.fullName;
        if (updates.phoneNumber)
            user.phoneNumber = updates.phoneNumber;
        if (updates.avatarUrl)
            user.avatarUrl = updates.avatarUrl;
        try {
            return await this.usersRepository.save(user);
        }
        catch (error) {
            console.error('❌ [UsersService] Error updating profile:', error);
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map