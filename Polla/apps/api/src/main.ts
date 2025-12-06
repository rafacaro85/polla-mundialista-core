import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Prefijo Global (Vital para el frontend)
  app.setGlobalPrefix('api');
  logger.log('✅ Global prefix configured: /api');

  // 2. CORS (Permisivo para evitar bloqueos iniciales)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  logger.log('✅ CORS enabled for all origins');

  // 3. PUERTO DINÁMICO (LA CLAVE)
  // Si Railway nos da un puerto, lo usamos. Si no, 3000 (local).
  // IMPORTANTE: Convertirlo a número por si acaso viene como string.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // 4. BINDING 0.0.0.0
  // Escuchar en todas las interfaces de red del contenedor.
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server running on port: ${port}`);
  logger.log(`🚀 Application is accessible at: http://0.0.0.0:${port}/api`);
  logger.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🔗 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'not set'}`);
}

bootstrap();
