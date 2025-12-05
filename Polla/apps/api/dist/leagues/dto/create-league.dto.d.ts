import { LeagueType } from '../../database/enums/league-type.enum';
export declare class CreateLeagueDto {
    name: string;
    type: LeagueType;
    maxParticipants: number;
    accessCodePrefix: string;
    packageType: string;
}
