import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MatchesService } from '../../matches/matches.service';

@Injectable()
export class TimeLockGuard implements CanActivate {
  private readonly LOCK_BUFFER_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

  constructor(private readonly matchesService: MatchesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const matchId = body.matchId;

    if (!matchId) {
      // Si no hay matchId en el body, quizás no es un endpoint de predicción válido o el DTO falló antes.
      // Dejamos pasar para que el Validator lo maneje, o rechazamos si es estricto.
      // Pero este Guard es especifico para upsertPrediction.
      return true;
    }

    const match = await this.matchesService.findMatchById(matchId);
    if (!match) {
      throw new NotFoundException(`Partido no encontrado con ID: ${matchId}`);
    }

    // 🔒 PRIORITY 1: Check manual lock first
    if (match.isManuallyLocked) {
      throw new ForbiddenException(
        '🔒 BLOQUEADO: Este partido ha sido bloqueado manualmente por el administrador. No se aceptan predicciones.',
      );
    }

    const now = new Date();
    const matchDate = new Date(match.date);

    // ⏰ PRIORITY 2: Check auto-lock (10 minutes before match)
    const lockTime = new Date(matchDate.getTime() - this.LOCK_BUFFER_MS);

    if (now >= lockTime) {
      const minutesUntilMatch = Math.floor(
        (matchDate.getTime() - now.getTime()) / 60000,
      );

      if (minutesUntilMatch <= 0) {
        throw new ForbiddenException(
          '⏰ TIEMPO AGOTADO: El partido ya ha comenzado. No se aceptan más predicciones.',
        );
      } else {
        throw new ForbiddenException(
          `⏰ TIEMPO AGOTADO: Las apuestas cierran 10 minutos antes del inicio. Faltan ${minutesUntilMatch} minutos para el partido.`,
        );
      }
    }

    return true;
  }
}
