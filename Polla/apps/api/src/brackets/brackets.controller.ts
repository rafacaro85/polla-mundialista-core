import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
  Delete,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BracketsService } from './brackets.service';
import { SaveBracketDto } from './dto/save-bracket.dto';

@Controller('brackets')
@UseGuards(JwtAuthGuard)
export class BracketsController {
  constructor(private readonly bracketsService: BracketsService) {}

  @Post()
  async saveBracket(
    @Req() req: Request & { user: any },
    @Body() dto: SaveBracketDto,
  ) {
    const userId = req.user.id;
    return this.bracketsService.saveBracket(userId, dto);
  }

  @Get('me')
  async getMyBracket(
    @Req() req: Request & { user: any },
    @Query('leagueId') leagueId?: string,
  ) {
    const userId = req.user.id;
    return this.bracketsService.getMyBracket(userId, leagueId);
  }

  @Delete('me')
  async clearMyBracket(@Req() req: Request & { user: any }) {
    const userId = req.user.id;
    await this.bracketsService.clearBracket(userId);
    return { success: true, message: 'Bracket eliminado exitosamente' };
  }

  @Post('recalculate')
  async recalculatePoints() {
    console.log('👉 Controller: accessing recalculatePoints');
    try {
      await this.bracketsService.recalculateAllBracketPoints();
      return { message: 'Bracket points recalculated successfully' };
    } catch (error) {
      console.error('❌ Controller detected error:', error);
      // Re-throw with message to ensure client gets the detail
      throw new InternalServerErrorException(
        error.message || 'Unknown error during recalculation',
      );
    }
  }
}
