import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user-dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }
    async create(dto: RegisterUserDto) {
        
    }
}
