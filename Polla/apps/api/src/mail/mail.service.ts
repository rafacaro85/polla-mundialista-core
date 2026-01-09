import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter;

    constructor() {
        // Configuración robusta para manejar tanto GMAIL como otros SMTP
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false // Ayuda con certificados auto-firmados en desarrollo
            }
        });
    }

    async sendVerificationEmail(to: string, code: string) {
        if (!process.env.SMTP_user && !process.env.SMTP_USER) {
            console.warn('⚠️ [MailService] SMTP credentials missing. Email not sent.');
            return;
        }

        const mailOptions = {
            from: `"Soporte Polla Mundialista" <${process.env.SMTP_USER}>`,
            to,
            subject: 'Verifica tu correo electrónico - Polla Mundialista',
            html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #0F172A; padding: 20px; text-align: center;">
            <h2 style="color: #00E676; margin: 0; font-family: 'Arial Black', sans-serif; text-transform: uppercase;">Polla Mundialista</h2>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; color: #334155;">
            <h3 style="margin-top: 0; color: #1E293B;">¡Bienvenido!</h3>
            <p>Gracias por registrarte. Usa el siguiente código para verificar tu cuenta y empezar a jugar:</p>
            
            <div style="background-color: #F8FAFC; border: 2px dashed #CBD5E1; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00E676;">${code}</span>
            </div>
            
            <p style="font-size: 14px; color: #64748B;">Este código expirará en 15 minutos.</p>
            <p style="margin-top: 30px;">Si no has solicitado este registro, puedes ignorar este mensaje.</p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #F1F5F9; padding: 15px; text-align: center; font-size: 12px; color: #94A3B8;">
            <p style="margin: 0;">© 2026 Polla Mundialista. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ [MailService] Verification email sent to %s (ID: %s)', to, info.messageId);
            return info;
        } catch (error) {
            console.error('❌ [MailService] Error sending email:', error);
            // No lanzamos error para no romper el flujo de registro, pero logueamos
        }
    }
}
