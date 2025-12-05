import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../database/entities/user.entity';
declare const LocalStrategy_base: new (...args: [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions] | []) => InstanceType<typeof Strategy> & {
    validate(...args: any[]): unknown | Promise<unknown>;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(email: string, pass: string): Promise<User>;
}
export {};
