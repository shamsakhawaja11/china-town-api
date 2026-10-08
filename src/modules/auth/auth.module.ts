import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Module({
  imports:[UsersService],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
