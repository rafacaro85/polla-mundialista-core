import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    create(email: string, fullName: string, password?: string, googleId?: string, avatarUrl?: string, phoneNumber?: string): Promise<User>;
    update(user: User, updates: Partial<User>): Promise<User>;
    updateProfile(userId: string, updates: {
        nickname?: string;
        fullName?: string;
        phoneNumber?: string;
        avatarUrl?: string;
    }): Promise<User>;
}
