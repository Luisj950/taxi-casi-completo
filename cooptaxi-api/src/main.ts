import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Esto es clave para que la web funcione
});


  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interceptor de logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CoopTaxi API')
    .setDescription('API REST para cooperativa de taxis — NestJS + TypeScript')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth',       'Autenticación y sesión')
    .addTag('users',      'Socios y perfiles')
    .addTag('despacho',   'Cola de despacho y carreras')
    .addTag('seguridad',  'Pánico e incidentes')
    .addTag('documentos', 'Licencias, matrícula, SPPAT, RTV')
    .addTag('finanzas',   'Cuotas y pagos')
    .addTag('flota',      'Vehículos y mantenimiento')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚕  CoopTaxi API`);
  console.log(`   REST  → http://localhost:${port}/api`);
  console.log(`   Docs  → http://localhost:${port}/api/docs`);
  console.log(`   Env   → ${process.env.NODE_ENV ?? 'development'}\n`);
}

bootstrap();
