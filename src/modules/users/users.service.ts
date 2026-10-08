import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }
    async create(name:string,hashPassword:string,email?:string,phone?:string,) {
        return this.prisma.users.create({
            data: {
                name,
                password_hash:hashPassword,
                email,
                phone,
            },omit:{
                password_hash:true,
            }
        })
    }
}
