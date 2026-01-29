import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
    private readonly chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    private readonly apiUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    constructor() {
        if (!this.botToken || !this.chatId) {
            this.logger.warn('⚠️ Telegram credentials not found in env. Admin alerts disabled.');
        }
    }

    async sendMessage(message: string): Promise<void> {
        if (!this.botToken || !this.chatId) return;

        try {
            await axios.post(this.apiUrl, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML',
            });
        } catch (error) {
            this.logger.error(`❌ Failed to send Telegram message: ${error.message}`);
            // Fire-and-forget: we don't throw to avoid blocking main flow
        }
    }

    async notifyNewUser(email: string, fullName: string): Promise<void> {
        const msg = `👤 <b>Nuevo Registro</b>\n\n<b>Nombre:</b> ${fullName}\n<b>Email:</b> ${email}`;
        await this.sendMessage(msg);
    }

    async notifyPayment(amount: number, userEmail: string, packageName?: string): Promise<void> {
        const msg = `💰 <b>Pago Recibido</b>\n\n<b>Usuario:</b> ${userEmail}\n<b>Monto:</b> $${amount}\n<b>Plan:</b> ${packageName || 'N/A'}`;
        await this.sendMessage(msg);
    }

    async notifyNewLeague(leagueName: string, code: string, userEmail: string): Promise<void> {
        const msg = `🏆 <b>Nueva Polla Creada</b>\n\n<b>Nombre:</b> ${leagueName}\n<b>Código:</b> ${code}\n<b>Admin:</b> ${userEmail}`;
        await this.sendMessage(msg);
    }
}
