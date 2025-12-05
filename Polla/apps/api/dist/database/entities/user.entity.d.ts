import { UserRole } from '../enums/user-role.enum';
import { Prediction } from './prediction.entity';
import { AccessCode } from './access-code.entity';
import { LeagueParticipant } from './league-participant.entity';
export declare class User {
    id: string;
    email: string;
    password?: string;
    googleId?: string;
    fullName: string;
    nickname: string;
    role: UserRole;
    avatarUrl?: string;
    phoneNumber?: string;
    isVerified: boolean;
    verificationCode?: string | null;
    createdAt: Date;
    predictions: Prediction[];
    accessCodesUsed: AccessCode[];
    leagueParticipants: LeagueParticipant[];
}
