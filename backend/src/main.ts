import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, resolve } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Asegurar que la carpeta de uploads existe al arrancar
  const uploadsDir = resolve(process.cwd(), 'uploads', 'products');
  mkdirSync(uploadsDir, { recursive: true });

  // Servir archivos estáticos de la carpeta uploads bajo la ruta /static
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/static' });

  // Prefijo global para todas las rutas de la API, exceptuando Swagger
  app.setGlobalPrefix('api', { exclude: ['api-docs', 'api-docs-json'] });

  // Habilitar CORS (configurable vía variable de entorno)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configuraciones Globales
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('COLOXI API')
    .setDescription('The COLOXI Inventory and Purchase Order Management API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce el token JWT',
        in: 'header',
      },
      'JWT-auth', // Nombre del esquema
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
