import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessCode } from '../database/entities/access-code.entity';
import { League } from '../database/entities/league.entity';
import { AccessCodeStatus } from '../database/enums/access-code-status.enum';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AccessCodesService {
  constructor(
    @InjectRepository(AccessCode)
    private accessCodeRepository: Repository<AccessCode>,
    @InjectRepository(League)
    private leagueRepository: Repository<League>,
  ) {}

  async generateCodes(
    leagueId: string,
    quantity: number,
  ): Promise<AccessCode[]> {
    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
    });
    if (!league) {
      throw new NotFoundException(`League with ID ${leagueId} not found.`);
    }

    // Usar el prefijo de la liga si existe, de lo contrario, usar el ID de la liga como prefijo por defecto
    const actualPrefix =
      league.accessCodePrefix || league.id.substring(0, 8).toUpperCase();

    const generatedCodes: AccessCode[] = [];
    for (let i = 0; i < quantity; i++) {
      const uniqueRandom = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const code = `${actualPrefix}-${uniqueRandom}`;
      const accessCode = this.accessCodeRepository.create({
        code,
        league,
        status: AccessCodeStatus.AVAILABLE,
      });
      generatedCodes.push(accessCode);
    }
    return this.accessCodeRepository.save(generatedCodes);
  }

  async validateCode(code: string): Promise<AccessCode> {
    const accessCode = await this.accessCodeRepository.findOne({
      where: { code, status: AccessCodeStatus.AVAILABLE },
      relations: ['league'],
    });

    if (!accessCode) {
      throw new BadRequestException('Invalid or used access code.');
    }
    return accessCode;
  }
}
