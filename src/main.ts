import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService=app.get(ConfigService);
  const portNumber=configService.getOrThrow<number>('PORT');
  await app.listen(portNumber);
}

void bootstrap();