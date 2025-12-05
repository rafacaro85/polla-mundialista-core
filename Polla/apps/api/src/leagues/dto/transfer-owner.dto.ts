import { IsString, IsUUID } from 'class-validator';

export class TransferOwnerDto {
    @IsUUID()
    @IsString()
    newAdminId: string;
}
