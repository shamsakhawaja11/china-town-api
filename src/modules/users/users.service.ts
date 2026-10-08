import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterUserDto } from '../auth/dto/register-user-dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }
    async create(dto: RegisterUserDto,hashPassword:string) {
        return this.prisma.users.create({
            data: {
                name:dto.name,
                email:dto.email,
                phone:dto.phone,
                password_hash:hashPassword
            },omit:{
                password_hash:true,
            }
        })
    }
}
