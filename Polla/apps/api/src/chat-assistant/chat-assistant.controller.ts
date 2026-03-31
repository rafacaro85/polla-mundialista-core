import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatAssistantService } from './chat-assistant.service';

@Controller('chat-assistant')
export class ChatAssistantController {
  constructor(private readonly chatAssistantService: ChatAssistantService) {}

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async ask(@Body() body: { messages: { role: string; content: string }[] }) {
    if (!body.messages || !Array.isArray(body.messages)) {
      return { answer: 'Error: Formato de mensajes inválido.' };
    }

    try {
      const response = await this.chatAssistantService.askProfe(body.messages);
      return { answer: response };
    } catch (error) {
      console.error('Error in ChatAssistantController:', error);
      return { answer: '¡Uy, mi llave! Entré en corto circuito. Intenta preguntarme de nuevo en unos segundos.' };
    }
  }
}
