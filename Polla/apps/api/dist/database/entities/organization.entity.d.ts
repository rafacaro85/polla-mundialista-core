import { User } from './user.entity';
export declare class Organization {
    id: string;
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    owner: User;
}
