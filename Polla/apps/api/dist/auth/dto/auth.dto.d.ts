export declare class RegisterDto {
    email: string;
    name: string;
    password: string;
    phoneNumber?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class VerifyEmailDto {
    email: string;
    code: string;
}
