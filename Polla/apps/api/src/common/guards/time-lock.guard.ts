import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MatchesService } from '../../matches/matches.service';

@Injectable()
export class TimeLockGuard implements CanActivate {
    constructor(private readonly matchesService: MatchesService) { }

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

        const now = new Date();
        const matchDate = new Date(match.date);

        // Damos un margen de tolerancia de 0 segundos (Estricto)
        if (now >= matchDate) {
            throw new ForbiddenException('TIEMPO AGOTADO: El partido ya ha comenzado. No se aceptan más predicciones.');
        }

        return true;
    }
}
