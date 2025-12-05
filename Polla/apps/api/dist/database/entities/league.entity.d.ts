import { Organization } from './organization.entity';
import { User } from './user.entity';
import { LeagueType } from '../enums/league-type.enum';
import { LeagueStatus } from '../enums/league-status.enum';
import { LeagueParticipant } from './league-participant.entity';
import { AccessCode } from './access-code.entity';
export declare class League {
    id: string;
    name: string;
    organization?: Organization;
    type: LeagueType;
    accessCodePrefix?: string;
    creator: User;
    maxParticipants: number;
    status: LeagueStatus;
    isPaid: boolean;
    packageType: string;
    brandingLogoUrl?: string;
    prizeDetails?: string;
    prizeImageUrl?: string;
    welcomeMessage?: string;
    participants: LeagueParticipant[];
    accessCodes: AccessCode[];
}
