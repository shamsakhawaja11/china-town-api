import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from '../users/dto/register-user-dto';

@Injectable()
export class AuthService {
    register(dto: RegisterUserDto) {
        
    }
}
