import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user-dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }
    async create(dto: RegisterUserDto) {
        const hashPassword = await argon2.hash(dto.password);
        return this.prisma.users.create({
            data: {
                name:dto.name,
                email:dto.email,
                phone:dto.phone,
                password_hash:hashPassword
            }
        })
    }
}
