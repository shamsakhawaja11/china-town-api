import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [UsersModule, JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      signOptions: {
        expiresIn: configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as any
      }
    })
  })],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule { }
