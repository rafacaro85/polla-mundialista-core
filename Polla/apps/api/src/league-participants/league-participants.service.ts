import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { AccessCode } from '../database/entities/access-code.entity';
import { AccessCodeStatus } from '../database/enums/access-code-status.enum';

@Injectable()
export class LeagueParticipantsService {
  constructor(
    @InjectRepository(LeagueParticipant)
    private leagueParticipantRepository: Repository<LeagueParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(League)
    private leagueRepository: Repository<League>,
    @InjectRepository(AccessCode)
    private accessCodeRepository: Repository<AccessCode>,
    private dataSource: DataSource,
  ) { }

  async joinLeague(userId: string, code: string, department?: string): Promise<LeagueParticipant> {
    console.log('joinLeague - userId:', userId, 'code:', code);

    try {
      // 1. Buscar usuario
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }

      // 2. Buscar liga por su código (accessCodePrefix)
      const league = await this.leagueRepository.findOne({
        where: { accessCodePrefix: code },
        relations: ['participants', 'participants.user'],
      });

      if (!league) {
        throw new NotFoundException('Liga no encontrada. Verifica el código.');
      }

      console.log('joinLeague - Liga encontrada:', league.name, 'ID:', league.id);

      // 3. Verificar si el usuario ya está en la liga
      const isAlreadyParticipant = league.participants.some(p => p.user.id === userId);
      if (isAlreadyParticipant) {
        throw new ConflictException('Ya eres participante de esta liga.');
      }

      // 4. Verificar capacidad
      if (league.participants.length >= league.maxParticipants) {
        throw new BadRequestException('Liga llena (Máx 3 en plan Gratis). El dueño debe ampliar cupo.');
      }

      // 5. Crear participante
      const leagueParticipant = this.leagueParticipantRepository.create({
        user: user,
        league: league,
        isAdmin: false,
        department: department,
      });

      const savedParticipant = await this.leagueParticipantRepository.save(leagueParticipant);
      console.log('joinLeague - Participante creado exitosamente');

      return savedParticipant;

    } catch (err) {
      console.error('joinLeague - Error:', err);
      throw err;
    }
  }

  async removeParticipant(
    leagueId: string,
    userIdToRemove: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<{ message: string }> {
    console.log(`🗑️ [removeParticipant] Liga: ${leagueId}, Remover: ${userIdToRemove}, Solicitante: ${requesterId}`);

    // 1. Verificar que la liga existe
    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['creator', 'participants', 'participants.user'],
    });

    if (!league) {
      throw new NotFoundException(`Liga con ID ${leagueId} no encontrada`);
    }

    // 2. Verificar permisos: SUPER_ADMIN o admin de la liga
    const isAdmin = league.creator.id === requesterId;
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN';

    if (!isAdmin && !isSuperAdmin) {
      throw new BadRequestException('Solo el administrador de la liga puede expulsar participantes');
    }

    // 3. Verificar que no se está intentando expulsar al admin
    if (userIdToRemove === league.creator.id) {
      throw new BadRequestException('El administrador no puede ser expulsado de su propia liga');
    }

    // 4. Buscar el participante
    const participant = league.participants.find(p => p.user.id === userIdToRemove);

    if (!participant) {
      throw new NotFoundException('El usuario no es participante de esta liga');
    }

    // 5. Eliminar participante
    await this.leagueParticipantRepository.remove(participant);

    console.log(`✅ [removeParticipant] Usuario ${userIdToRemove} expulsado de la liga ${league.name}`);

    return {
      message: `Usuario expulsado exitosamente de la liga "${league.name}"`,
    };
  }

  async toggleBlockParticipant(
    leagueId: string,
    userIdToBlock: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<{ message: string; isBlocked: boolean }> {
    // 1. Verificar que la liga existe
    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['creator', 'participants', 'participants.user'],
    });

    if (!league) {
      throw new NotFoundException(`Liga con ID ${leagueId} no encontrada`);
    }

    // 2. Verificar permisos: SUPER_ADMIN o admin de la liga
    const isAdmin = league.creator.id === requesterId;
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN';

    if (!isAdmin && !isSuperAdmin) {
      throw new BadRequestException('Solo el administrador de la liga puede bloquear participantes');
    }

    // 3. Verificar que no se está intentando bloquear al admin
    if (userIdToBlock === league.creator.id) {
      throw new BadRequestException('El administrador no puede ser bloqueado de su propia liga');
    }

    // 4. Buscar el participante
    const participant = league.participants.find(p => p.user.id === userIdToBlock);

    if (!participant) {
      throw new NotFoundException('El usuario no es participante de esta liga');
    }

    // 5. Alternar estado de bloqueo
    participant.isBlocked = !participant.isBlocked;
    await this.leagueParticipantRepository.save(participant);

    return {
      message: `Usuario ${participant.isBlocked ? 'bloqueado' : 'desbloqueado'} exitosamente`,
      isBlocked: participant.isBlocked,
    };
  }

  async assignTriviaPoints(
    leagueId: string,
    userId: string,
    points: number,
    requesterId: string,
    requesterRole: string,
  ) {
    // 1. Verificar que la liga existe
    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['creator', 'participants', 'participants.user'],
    });

    if (!league) {
      throw new NotFoundException(`Liga con ID ${leagueId} no encontrada`);
    }

    // 2. Verificar permisos: SUPER_ADMIN o admin de la liga
    const isAdmin = league.creator.id === requesterId;
    const isSuperAdmin = requesterRole === 'SUPER_ADMIN';

    if (!isAdmin && !isSuperAdmin) {
      throw new BadRequestException('Solo el administrador de la liga puede asignar puntos de trivia');
    }

    // 3. Buscar el participante
    const participant = league.participants.find(p => p.user.id === userId);

    if (!participant) {
      throw new NotFoundException('El usuario no es participante de esta liga');
    }

    // 4. Asignar puntos (sumar)
    participant.triviaPoints = (participant.triviaPoints || 0) + points;
    await this.leagueParticipantRepository.save(participant);

    return {
      message: `Se han asignado ${points} puntos de trivia a ${participant.user.nickname || participant.user.fullName}`,
      totalTriviaPoints: participant.triviaPoints,
    };
  }
  async updateParticipant(
    leagueId: string,
    userId: string,
    data: { department?: string },
    requesterId: string,
    requesterRole: string,
  ) {
    // 1. Verificar Liga
    const league = await this.leagueRepository.findOne({
      where: { id: leagueId },
      relations: ['creator'],
    });

    if (!league) throw new NotFoundException('Liga no encontrada');

    // 2. Permisos
    const isAdmin = league.creator.id === requesterId;
    if (!isAdmin && requesterRole !== 'SUPER_ADMIN') {
      throw new BadRequestException('No tienes permisos para editar participantes');
    }

    // 3. Buscar participante
    const participant = await this.leagueParticipantRepository.findOne({
      where: { league: { id: leagueId }, user: { id: userId } },
    });

    if (!participant) throw new NotFoundException('Participante no encontrado');

    // 4. Actualizar
    if (data.department !== undefined) {
      participant.department = data.department;
    }

    return this.leagueParticipantRepository.save(participant);
  }
}
