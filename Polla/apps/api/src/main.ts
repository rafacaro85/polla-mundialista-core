import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // 1. CONFIGURAR PREFIJO GLOBAL (DEBE SER PRIMERO)
  app.setGlobalPrefix('api');
  console.log('✅ Global prefix configured: /api');

  // 2. Security: Helmet
  app.use(helmet());

  // 3. Habilitar CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL, // URL de Vercel en producción
  ].filter(Boolean); // Eliminar undefined

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  console.log('✅ CORS enabled for:', allowedOrigins);

  // 4. Validation Pipe global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 5. Increase body limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📡 API Base URL: http://localhost:${port}/api`);
}
bootstrap();
