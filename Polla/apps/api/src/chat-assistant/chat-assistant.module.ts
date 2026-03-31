import { Module } from '@nestjs/common';
import { ChatAssistantController } from './chat-assistant.controller';
import { ChatAssistantService } from './chat-assistant.service';

@Module({
  controllers: [ChatAssistantController],
  providers: [ChatAssistantService],
  exports: [ChatAssistantService],
})
export class ChatAssistantModule {}
