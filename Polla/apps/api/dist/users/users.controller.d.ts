import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';
interface RequestWithUser extends Request {
    user: User;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(): unknown;
    updateProfile(req: RequestWithUser, body: {
        nickname?: string;
        fullName?: string;
        phoneNumber?: string;
        avatarUrl?: string;
    }): unknown;
    updateUser(id: string, body: Partial<User>): unknown;
}
export {};
