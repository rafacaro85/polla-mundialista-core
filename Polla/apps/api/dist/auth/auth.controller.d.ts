import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import type { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    googleAuth(req: any): Promise<void>;
    googleAuthRedirect(req: {
        user: User;
    }, res: Response): Promise<void>;
    register(body: RegisterDto): Promise<User>;
    login(loginDto: LoginDto, req: {
        user: User;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../database/enums/user-role.enum").UserRole;
            avatarUrl: string | undefined;
        };
    }>;
    forgotPassword(body: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verify(body: VerifyEmailDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../database/enums/user-role.enum").UserRole;
            avatarUrl: string | undefined;
        };
    }>;
    getProfile(req: {
        user: User;
    }): Promise<{
        id: string;
        email: string;
        googleId?: string;
        fullName: string;
        nickname: string;
        role: import("../database/enums/user-role.enum").UserRole;
        avatarUrl?: string;
        phoneNumber?: string;
        isVerified: boolean;
        verificationCode?: string | null;
        createdAt: Date;
        predictions: import("../database/entities/prediction.entity").Prediction[];
        accessCodesUsed: import("../database/entities/access-code.entity").AccessCode[];
        leagueParticipants: import("../database/entities/league-participant.entity").LeagueParticipant[];
    }>;
    logout(res: Response): Promise<Response<any, Record<string, any>>>;
}
