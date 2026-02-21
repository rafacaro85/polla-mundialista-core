import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
// 🔥 Forzar que el .env local solo sobreescriba en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ override: true });
}

import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // 🔥 CRÍTICO para Railway: Confiar en el proxy para cabeceras X-Forwarded-Proto
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // 0. Seguridad HTTP Headers (Helmet)
  app.use(helmet());

  // 0.1 Validación Global de DTOs (Blindaje)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían campos extra
      transform: true, // Convierte tipos automáticamente
    }),
  );

  // 1. Prefijo Global (Vital para el frontend)
  app.setGlobalPrefix('api');
  logger.log('✅ Global prefix configured: /api');

  // 2. CORS (Configuración explícita)
  // 2. CORS (Configuración explícita)
  // 2. CORS (Configuración explícita - Permisiva para Producción/Beta)
  app.enableCors({
    origin: true, // Refleja el origen de la petición (Permite cualquier dominio)
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true, // Permitir cookies/headers de autorización
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Tournament-Id',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  logger.log('✅ CORS enabled with PERMISSIVE mode (origin: true)');
  logger.log('✅ CORS enabled with explicit configuration');

  // 3. PUERTO DINÁMICO (LA CLAVE)
  // Si Railway nos da un puerto, lo usamos. Si no, 3000 (local).
  // IMPORTANTE: Convertirlo a número por si acaso viene como string.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

  // 4. BINDING 0.0.0.0
  // Escuchar en todas las interfaces de red del contenedor.
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server running on port: ${port}`);
  logger.log(`🚀 ACTIVE DATABASE_URL: ${process.env.DATABASE_URL || 'NOT SET'}`);
  logger.log(`🚀 ACTIVE DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
  logger.log(`🚀 Application is accessible at: http://0.0.0.0:${port}/api`);
  logger.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(
    `🔗 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'not set'}`,
  );
  logger.log(
    `🔑 Google Auth Config: CLIENT_ID=${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌'}, SECRET=${process.env.GOOGLE_SECRET ? '✅' : '❌'}`,
  );
}

bootstrap();
