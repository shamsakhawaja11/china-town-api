import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

@Module({
  imports:[UsersModule,JwtModule.registerAsync({
    inject:[ConfigService],
    useFactory:async(configService:ConfigService)=>({
      secret:configService.getOrThrow<string>('JWT_ACCESS_TOKEN'),
        signOptions: configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN')
    })
    

  })],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
