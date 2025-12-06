import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // 1. CONFIGURAR PREFIJO GLOBAL (DEBE SER PRIMERO)
  app.setGlobalPrefix('api');
  logger.log('✅ Global prefix configured: /api');

  // 2. Security: Helmet
  app.use(helmet());

  // 3. CONFIGURACIÓN CORS (Permisiva para debug, ajustar en producción)
  app.enableCors({
    origin: '*', // TODO: Cambiar a dominios específicos en producción
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  logger.log('✅ CORS enabled for all origins (*)');

  // 4. Validation Pipe global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 5. Increase body limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // 6. PUERTO DINÁMICO (CRÍTICO)
  // Railway inyecta el puerto en process.env.PORT. Si no existe, usa 3000.
  const port = process.env.PORT || 3000;

  // 7. HOST 0.0.0.0 (CRÍTICO)
  // Es obligatorio escuchar en '0.0.0.0' en contenedores Docker/Railway.
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://0.0.0.0:${port}/api`);
  logger.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
}

bootstrap();
