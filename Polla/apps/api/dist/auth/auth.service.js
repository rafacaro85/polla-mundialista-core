"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (user && user.password && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async validateUserWithExceptions(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('This account was created with Google. Please use "Continue with Google" to sign in, or register with the same email to add a password.');
        }
        if (!await bcrypt.compare(pass, user.password)) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { password, ...result } = user;
        return result;
    }
    async login(user) {
        if (!user.isVerified && user.password) {
            throw new common_1.UnauthorizedException('Email not verified. Please verify your email.');
        }
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        };
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            if (existingUser.password) {
                throw new common_1.ConflictException('Email already registered. Please login instead.');
            }
            console.log('🔄 [Register] Usuario de Google encontrado. Agregando contraseña...');
            console.log(`   Email: ${existingUser.email}`);
            console.log(`   ID: ${existingUser.id}`);
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const updatedUser = await this.usersService.update(existingUser, {
                password: hashedPassword,
                verificationCode,
                isVerified: false,
                fullName: registerDto.name || existingUser.fullName,
                phoneNumber: registerDto.phoneNumber || existingUser.phoneNumber
            });
            console.log('📧 [MOCK EMAIL SERVICE] ------------------------------------------------');
            console.log(`   To: ${registerDto.email}`);
            console.log(`   Subject: Password added to your account - Verify your email`);
            console.log(`   Code: ${verificationCode}`);
            console.log(`   Message: You've added password login to your Google account.`);
            console.log('----------------------------------------------------------------------');
            if (registerDto.phoneNumber) {
                console.log('📱 [MOCK SMS SERVICE] --------------------------------------------------');
                console.log(`   To: ${registerDto.phoneNumber}`);
                console.log(`   Message: Your verification code is: ${verificationCode}`);
                console.log('----------------------------------------------------------------------');
            }
            const { password, ...result } = updatedUser;
            return result;
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const user = await this.usersService.create(registerDto.email, registerDto.name, hashedPassword, undefined, undefined, registerDto.phoneNumber);
        await this.usersService.update(user, { verificationCode, isVerified: false });
        console.log('📧 [MOCK EMAIL SERVICE] ------------------------------------------------');
        console.log(`   To: ${registerDto.email}`);
        console.log(`   Subject: Verify your email`);
        console.log(`   Code: ${verificationCode}`);
        console.log('----------------------------------------------------------------------');
        if (registerDto.phoneNumber) {
            console.log('📱 [MOCK SMS SERVICE] --------------------------------------------------');
            console.log(`   To: ${registerDto.phoneNumber}`);
            console.log(`   Message: Your verification code is: ${verificationCode}`);
            console.log('----------------------------------------------------------------------');
        }
        const { password, ...result } = user;
        return result;
    }
    async verifyEmail(verifyEmailDto) {
        const user = await this.usersService.findByEmail(verifyEmailDto.email);
        if (!user) {
            throw new common_1.BadRequestException('Invalid email or code');
        }
        if (user.isVerified) {
            return this.login(user);
        }
        if (user.verificationCode !== verifyEmailDto.code) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        const updatedUser = await this.usersService.update(user, {
            isVerified: true,
            verificationCode: null
        });
        return this.login(updatedUser);
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);
        if (!user) {
            return { message: 'If the email exists, a recovery link has been sent.' };
        }
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        console.log(`🔗 [Recovery Link] http://localhost:3000/reset-password?token=${token}`);
        return { message: 'If the email exists, a recovery link has been sent.' };
    }
    async validateGoogleUser(profile) {
        console.log('🔍 [Google OAuth] Validando usuario de Google...');
        console.log(`   📧 Email: ${profile.email}`);
        console.log(`   👤 Nombre: ${profile.firstName} ${profile.lastName}`);
        const existingUser = await this.usersService.findByEmail(profile.email);
        if (existingUser) {
            console.log(`✅ [Google OAuth] Usuario encontrado en BD`);
            console.log(`   ID: ${existingUser.id}`);
            console.log(`   Rol: ${existingUser.role}`);
            console.log(`   🔄 Actualizando foto de perfil...`);
            const updatedUser = await this.usersService.update(existingUser, {
                googleId: profile.email,
                avatarUrl: profile.picture,
                isVerified: true
            });
            console.log(`✅ [Google OAuth] Usuario actualizado y retornado`);
            return updatedUser;
        }
        console.log(`📝 [Google OAuth] Usuario NO encontrado. Creando nuevo usuario...`);
        const newUser = await this.usersService.create(profile.email, `${profile.firstName} ${profile.lastName}`, undefined, profile.email, profile.picture);
        await this.usersService.update(newUser, { isVerified: true });
        console.log(`✅ [Google OAuth] Nuevo usuario creado`);
        console.log(`   ID: ${newUser.id}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Rol: ${newUser.role}`);
        return newUser;
    }
    async googleLogin(user) {
        return this.login(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map