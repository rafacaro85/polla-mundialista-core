import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { User } from '../database/entities/user.entity';
import type { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    private readonly usersService;
    constructor(authService: AuthService, usersService: UsersService);
    googleAuth(req: any): any;
    googleAuthRedirect(req: {
        user: User;
    }, res: Response): unknown;
    register(body: RegisterDto): unknown;
    login(loginDto: LoginDto, req: {
        user: User;
    }): unknown;
    forgotPassword(body: ForgotPasswordDto): unknown;
    verify(body: VerifyEmailDto): unknown;
    getProfile(req: {
        user: User;
    }): unknown;
    logout(res: Response): unknown;
}
