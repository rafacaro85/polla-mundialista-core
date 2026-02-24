import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
// 🔥 Forzar que el .env local solo sobreescriba en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ override: true });
}

import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// [REDEPLOY FORCE] v1.0.2 - Diagnostic Logs Deployment
async function bootstrap() {
  console.log('🔥 [BOOTSTRAP] Starting API v1.0.2...');
  console.log('📡 [BOOTSTRAP] Initial NODE_ENV:', process.env.NODE_ENV);
  
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Validación Básica
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 2. Prefijo Global
  app.setGlobalPrefix('api');

  // 3. CORS Original (Permisivo para evitar bloqueos)
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Tournament-Id',
    ],
  });

  // 4. Puerto y Escucha
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server running on port: ${port}`);
  logger.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
