import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user-dto';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { normalizeContact } from '../../common/utils/normalize-contact';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private prismaService: PrismaService, private jwtService: JwtService) { }
    async register(dto: RegisterUserDto) {
        const hashPassword = await argon2.hash(dto.password);
        return this.usersService.create(dto.name, hashPassword, dto.email, dto.phone,)
    }
    async validateUser(contact: string, password: string) {
        const contactType = normalizeContact(contact);

        if (!contactType) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const user = contactType.type === 'phone' ?
            await this.prismaService.users.findUnique({
                where: { phone: contactType.value }
            }) :
            await this.prismaService.users.findUnique({
                where: { email: contactType.value }
            });
        if (!user || !user.is_active) {
            throw new UnauthorizedException('Invalid credentials');
        }
        let passwordMatches = false;
        try {
            passwordMatches = await argon2.verify(user.password_hash, password);
        } catch {
            passwordMatches = false;
        }
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid credentials')
        }
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async generateAccessToken(user: { role: 'admin' | 'customer' | 'staff', sub: string }) {
        const payload = { role: user.role, sub: user.sub };
        return this.jwtService.signAsync(payload)
    }
}
