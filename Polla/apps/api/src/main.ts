import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
// 🔥 Forzar que el .env local solo sobreescriba en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ override: true });
}

import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// [REDEPLOY FORCE] v1.0.3 - Cleanup diagnostic logs
async function bootstrap() {
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

  // 3. CORS — Whitelist de orígenes permitidos (fix seguridad)
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://lapollavirtual.com',
        'https://www.lapollavirtual.com',
        'https://champions.lapollavirtual.com',
        ...(process.env.NODE_ENV !== 'production'
          ? ['http://localhost:3000', 'http://localhost:3001']
          : []),
      ];

      // Permite requests sin origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
