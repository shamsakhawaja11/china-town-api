import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user-dto';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
    constructor(private usersService:UsersService) { }
    async register(dto: RegisterUserDto) {
        const hashPassword=await argon2.hash(dto.password);
        return this.usersService.create(dto.name,hashPassword,dto.email,dto.phone,)
    }
}
