import * as nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar .env manualmente
const result = config({ path: resolve(__dirname, '../.env') });

console.log('--- DIAGNÓSTICO SMTP ---');
if (result.error) {
  console.error('❌ Error cargando .env:', result.error);
} else {
  console.log('✅ .env cargado correctamente.');
}

async function main() {
  console.log(`HOST: ${process.env.SMTP_HOST}`);
  console.log(`PORT: ${process.env.SMTP_PORT}`);
  console.log(`SECURE: ${process.env.SMTP_SECURE}`);
  console.log(`USER: ${process.env.SMTP_USER}`);
  console.log(`PASS: ${process.env.SMTP_PASS ? '*** (Presente)' : 'FALTA'}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Habilitar logs detallados
    debug: true,
    logger: true,
  });

  try {
    console.log('⏳ Probando conexión (verify)...');
    await transporter.verify();
    console.log('✅ VERIFY OK. Credenciales aceptadas.');

    console.log('⏳ Enviando correo de prueba a sí mismo...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Diagnóstico SMTP Polla Mundialista',
      text: '¡Funciona! Tu configuración SMTP es correcta.',
    });
    console.log('✅ CORREO ENVIADO:', info.messageId);
    console.log('Respuesta completa:', info.response);
  } catch (error) {
    console.error('❌ ERROR SMTP:', error.message);
    if (error.code === 'EAUTH') {
      console.error(
        '👉 CAUSA PROBABLE: Contraseña incorrecta o Bloqueo de Google.',
      );
      console.error('👉 SOLUCIÓN: Genera una "Contraseña de Aplicación".');
    }
  }
}

main().catch(console.error);
