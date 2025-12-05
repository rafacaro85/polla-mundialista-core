import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';
interface RequestWithUser extends Request {
    user: User;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(): Promise<{
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
    }[]>;
    updateProfile(req: RequestWithUser, body: {
        nickname?: string;
        fullName?: string;
        phoneNumber?: string;
        avatarUrl?: string;
    }): Promise<User>;
    updateUser(id: string, body: Partial<User>): Promise<User>;
}
export {};
