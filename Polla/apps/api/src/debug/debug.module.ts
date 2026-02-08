import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BonusQuestion, UserBonusAnswer])],
  controllers: [DebugController],
})
export class DebugModule {}
