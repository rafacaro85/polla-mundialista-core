import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

@Injectable()
export class MailService {
    private transporter;

    constructor() {
        const user = process.env.SMTP_USER || process.env.SMTP_user;
        const pass = process.env.SMTP_PASS || process.env.SMTP_pass;

        console.log(`📡 [MailService] SMTP Config: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 587} (User: ${user ? '✅ set' : '❌ missing'})`);

        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass, // Debes usar la "Contraseña de aplicación" de 16 caracteres
            },
            connectionTimeout: 5000, // 5 segundos max para conectar
            greetingTimeout: 5000,   // 5 segundos max para el saludo SMTP
            socketTimeout: 10000     // 10 segundos max para actividad de socket
        });
    }

    private async sendViaResend(to: string, subject: string, html: string) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) return null;

        try {
            const response = await axios.post('https://api.resend.com/emails', {
                from: 'Polla Mundialista <onboarding@resend.dev>', // Usar dominio de prueba de Resend por defecto
                to: [to],
                subject,
                html,
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return { success: true, messageId: response.data.id };
        } catch (error: any) {
            console.error('❌ [Resend] Error:', error.response?.data || error.message);
            return { success: false, error: error.message };
        }
    }

    async sendVerificationEmail(to: string, code: string) {
        const html = `
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
      `;

        // Intentar Resend primero si hay API KEY
        if (process.env.RESEND_API_KEY) {
            const result = await this.sendViaResend(to, 'Verifica tu correo electrónico - Polla Mundialista', html);
            if (result?.success) {
                console.log('✅ [MailService] Verification email sent via Resend to %s (ID: %s)', to, result.messageId);
                return result;
            }
        }

        const smtpUser = process.env.SMTP_USER || process.env.SMTP_user;
        if (!smtpUser) {
            console.warn('⚠️ [MailService] SMTP_USER is not set and Resend not configured. Email cannot be sent.');
            return { success: false, error: 'SMTP_USER is not set and Resend not configured.' };
        }

        const mailOptions = {
            from: `"Soporte Polla Mundialista" <${smtpUser}>`,
            to,
            subject: 'Verifica tu correo electrónico - Polla Mundialista',
            html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ [MailService] Verification email sent to %s', to);
            return { success: true, messageId: info.messageId };
        } catch (error: any) {
            console.error('❌ [MailService] Error enviando correo a %s:', to, error);
            // Devolver el error para que podamos diagnosticarlo
            return { success: false, error: error.message, code: error.code };
        }
    }
    async sendResetPasswordEmail(to: string, resetLink: string) {
        const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #0F172A; padding: 20px; text-align: center;">
            <h2 style="color: #00E676; margin: 0; font-family: 'Arial Black', sans-serif; text-transform: uppercase;">Polla Mundialista</h2>
          </div>
          
          <div style="padding: 30px; color: #334155;">
            <h3 style="margin-top: 0; color: #1E293B;">Recuperar Contraseña</h3>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #00E676; color: #0F172A; padding: 15px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">RESTABLECER CONTRASEÑA</a>
            </div>
            
            <p style="font-size: 14px; color: #64748B;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
            <p style="font-size: 12px; color: #00E676; word-break: break-all;">${resetLink}</p>
            
            <p style="font-size: 14px; color: #64748B; margin-top: 20px;">Este enlace expirará en 1 hora.</p>
            <p style="margin-top: 30px;">Si no has solicitado este cambio, puedes ignorar este mensaje.</p>
          </div>
          
          <div style="background-color: #F1F5F9; padding: 15px; text-align: center; font-size: 12px; color: #94A3B8;">
            <p style="margin: 0;">© 2026 Polla Mundialista. Todos los derechos reservados.</p>
          </div>
        </div>
      `;

        if (process.env.RESEND_API_KEY) {
            const result = await this.sendViaResend(to, 'Recupera tu contraseña - Polla Mundialista', html);
            if (result?.success) {
                console.log('✅ [MailService] Reset password email sent via Resend to %s (ID: %s)', to, result.messageId);
            }
            return result;
        }

        const smtpUser = process.env.SMTP_USER || process.env.SMTP_user;
        if (!smtpUser) {
            console.warn('⚠️ [MailService] SMTP_USER is not set and Resend not configured. Email cannot be sent.');
            return { success: false, error: 'SMTP_USER is not set and Resend not configured.' };
        }

        const mailOptions = {
            from: `"Soporte Polla Mundialista" <${smtpUser}>`,
            to,
            subject: 'Recupera tu contraseña - Polla Mundialista',
            html,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ [MailService] Reset password email sent to %s', to);
            return { success: true, messageId: info.messageId };
        } catch (error: any) {
            console.error('❌ [MailService] Error enviando correo de recuperación:', to, error);
            return { success: false, error: error.message, code: error.code };
        }
    }
}
