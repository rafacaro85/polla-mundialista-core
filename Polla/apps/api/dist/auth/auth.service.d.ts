import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, ForgotPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<User | null>;
    validateUserWithExceptions(email: string, pass: string): Promise<User>;
    login(user: User): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../database/enums/user-role.enum").UserRole;
            avatarUrl: string | undefined;
        };
    }>;
    register(registerDto: RegisterDto): Promise<User>;
    verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../database/enums/user-role.enum").UserRole;
            avatarUrl: string | undefined;
        };
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    validateGoogleUser(profile: {
        email: string;
        firstName: string;
        lastName: string;
        picture: string;
    }): Promise<User>;
    googleLogin(user: User): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../database/enums/user-role.enum").UserRole;
            avatarUrl: string | undefined;
        };
    }>;
}
