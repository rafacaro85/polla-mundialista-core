import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { BonusService } from './bonus.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { GradeQuestionDto } from './dto/grade-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('bonus')
@UseGuards(JwtAuthGuard)
export class BonusController {
    constructor(private readonly bonusService: BonusService) { }

    // Admin: Crear pregunta
    @Post('questions')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async createQuestion(@Request() req: any, @Body() dto: CreateQuestionDto) { // Inyectamos Request
        // SEGURIDAD: Solo SUPER_ADMIN puede crear preguntas Globales (sin leagueId)
        if (!dto.leagueId && req.user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Solo los Super Administradores pueden crear preguntas globales. Por favor asigna una liga a la pregunta.');
        }
        return this.bonusService.createQuestion(dto);
    }

    // Listar preguntas activas (usuario)
    @Get('questions')
    async getActiveQuestions(@Query('leagueId') leagueId?: string) {
        return this.bonusService.getActiveQuestions(leagueId);
    }

    // Admin: Listar todas las preguntas
    @Get('questions/all')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async getAllQuestions() {
        return this.bonusService.getAllQuestions();
    }

    // Usuario: Guardar respuesta
    @Post('answer')
    async saveAnswer(@Request() req: any, @Body() dto: SaveAnswerDto) {
        return this.bonusService.saveAnswer(req.user.id, dto);
    }

    // Usuario: Obtener mis respuestas
    @Get('my-answers')
    async getMyAnswers(@Request() req: any, @Query('leagueId') leagueId?: string) {
        return this.bonusService.getUserAnswers(req.user.id, leagueId);
    }

    // Admin: Calificar pregunta
    @Post('grade/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async gradeQuestion(@Param('id') questionId: string, @Body() dto: GradeQuestionDto) {
        return this.bonusService.gradeQuestion(questionId, dto);
    }

    // Admin: Eliminar pregunta
    @Delete('questions/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async deleteQuestion(@Param('id') questionId: string) {
        await this.bonusService.deleteQuestion(questionId);
        return { message: 'Pregunta eliminada exitosamente' };
    }

    // Admin: Editar pregunta
    @Put('questions/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async updateQuestion(@Param('id') questionId: string, @Body() dto: CreateQuestionDto) {
        return this.bonusService.updateQuestion(questionId, dto);
    }
}
