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

    private formatName(fullName: string): string {
        if (!fullName || fullName.includes('undefined')) {
            return 'Cliente Nuevo';
        }
        return fullName.trim();
    }

    private formatWhatsAppLink(phone: string): string {
        if (!phone) return 'Sin celular';
        // Clean phone: remove +, spaces, dashes
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        // Default to Colombia (57) if no country code seems present (length check)
        // This is a naive heuristic, can be improved.
        const finalPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
        
        return `<a href="https://wa.me/${finalPhone}?text=Hola%20${encodeURIComponent('¡Bienvenido a La Polla Virtual!')}">📲 Abrir WhatsApp (${phone})</a>`;
    }

    async notifyNewUser(email: string, fullName: string, phone?: string): Promise<void> {
        const name = this.formatName(fullName);
        const waLink = this.formatWhatsAppLink(phone || '');
        
        const msg = `👤 <b>Nuevo Lead (Registro)</b>\n\n<b>Nombre:</b> ${name}\n<b>Email:</b> ${email}\n<b>Celular:</b> ${phone || 'N/A'}\n\n${waLink}`;
        await this.sendMessage(msg);
    }

    async notifyPayment(amount: number, userEmail: string, packageName?: string, phone?: string, fullName?: string): Promise<void> {
        const name = this.formatName(fullName || '');
        const waLink = this.formatWhatsAppLink(phone || '');

        const msg = `💰 <b>Pago Recibido (Venta)</b>\n\n<b>Usuario:</b> ${name} (${userEmail})\n<b>Monto:</b> $${amount}\n<b>Plan:</b> ${packageName || 'N/A'}\n\n${waLink}`;
        await this.sendMessage(msg);
    }

    async notifyNewLeague(leagueName: string, code: string, userEmail: string, phone?: string, fullName?: string, isPaid: boolean = false): Promise<void> {
        const name = this.formatName(fullName || '');
        const waLink = this.formatWhatsAppLink(phone || '');
        const typeEmoji = isPaid ? '💲 PAGA' : '🆓 GRATIS';

        const msg = `🏆 <b>Nueva Polla (${typeEmoji})</b>\n\n<b>Nombre:</b> ${leagueName}\n<b>Código:</b> ${code}\n<b>Admin:</b> ${name} (${userEmail})\n<b>Celular:</b> ${phone || 'N/A'}\n\n${waLink}`;
        await this.sendMessage(msg);
    }
}
