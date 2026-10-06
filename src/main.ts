import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/all-exceptions.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const portNumber = configService.getOrThrow<number>('PORT');
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api')
  app.enableVersioning(
    {
      type:VersioningType.URI,
      defaultVersion:'1'
    }
  )
  app.useGlobalFilters(
    new GlobalExceptionFilter()
  )
  await app.listen(portNumber);
}

void bootstrap();
