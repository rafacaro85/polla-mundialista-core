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

    // Handle Bulk Predictions (Array)
    if (body.predictions && Array.isArray(body.predictions)) {
      for (const p of body.predictions) {
        if (p.matchId) {
          await this.validateMatchLock(p.matchId);
        }
      }
      return true;
    }

    // Handle Single Prediction
    const matchId = body.matchId;
    if (matchId) {
      await this.validateMatchLock(matchId);
      return true;
    }

    // If no matchId found (or other endpoints), let it pass (or handle accordingly)
    // Warning: ideally, we should only apply this guard to specific endpoints
    return true;
  }

  private async validateMatchLock(matchId: string) {
    // Validar que el matchId sea un UUID válido antes de hacer query a PostgreSQL
    // Un ID no-UUID causaría error 22P02 (invalid_text_representation) → 500
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(matchId)) {
      console.error(`TimeLockGuard: matchId inválido (no UUID): "${matchId}"`);
      throw new NotFoundException(`ID de partido inválido: ${matchId}`);
    }

    let match;
    try {
      match = await this.matchesService.findMatchById(matchId);
    } catch (err) {
      console.error(`TimeLockGuard: Error al buscar partido ${matchId}:`, err.message, err.code);
      throw err;
    }

    if (!match) {
      throw new NotFoundException(`Partido no encontrado con ID: ${matchId}`);
    }

    // 🔒 PRIORITY 0: Check if match is FINISHED
    if (match.status === 'FINISHED' || match.status === 'COMPLETED') {
      throw new ForbiddenException(
        '⛔ ERROR CRÍTICO: El partido ya ha finalizado. No se aceptan predicciones bajo ninguna circunstancia.',
      );
    }

    // 🔒 PRIORITY 1: Check manual lock first
    if (match.isManuallyLocked) {
      throw new ForbiddenException(
        '🔒 BLOQUEADO: Este partido ha sido bloqueado manualmente por el administrador. No se aceptan predicciones.',
      );
    }

    const now = new Date();
    const matchDate = new Date(match.date);

    const lockTime = new Date(matchDate.getTime() - this.LOCK_BUFFER_MS);

    if (now >= lockTime) {
      const minutesUntilMatch = Math.floor(
        (matchDate.getTime() - now.getTime()) / 60000,
      );

      throw new ForbiddenException(
        minutesUntilMatch <= 0
          ? '⏰ TIEMPO AGOTADO: El partido ya ha comenzado. No se aceptan más predicciones.'
          : `⏰ TIEMPO AGOTADO: Las apuestas cierran 10 minutos antes del inicio.`,
      );
    }
  }
}
