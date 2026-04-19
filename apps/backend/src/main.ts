import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = process.env.NODE_ENV ?? 'development';
  const port = process.env.PORT ?? 3000;

  const allowedOrigins = [
    process.env.FRONTEND_URL ?? '',
    process.env.LANDING_URL ?? '',
    'https://automatiza360-frontend.vercel.app',
    'https://automatiza360.vercel.app',
    'https://automatiza360-landing.vercel.app',
    'https://automatiza360.com',
    'https://www.automatiza360.com',
  ].filter(Boolean);

  app.enableCors({
    origin: env === 'production' ? allowedOrigins : true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Automatiza360 API')
    .setDescription('API para la plataforma de automatización de negocios con IA')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  Logger.log(`Automatiza360 Backend running in ${env.toUpperCase()} mode on port ${port}`, 'Bootstrap');
  if (env !== 'production') {
    Logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}
bootstrap();
