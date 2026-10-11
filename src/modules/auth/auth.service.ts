import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user-dto';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { normalizeContact } from '../../common/utils/normalize-contact';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { number } from 'joi';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private prismaService: PrismaService, private jwtService: JwtService, private configService: ConfigService) { }

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
    async refreshAccessToken(refreshToken: string) {
        const hashedToken = createHash('sha256').update(refreshToken).digest('hex')
        const token = await this.prismaService.refresh_tokens.findUnique({ where: { token_hash: hashedToken } })
        if (!token || token.expires_at < new Date()) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const user = await this.prismaService.users.findUnique({ where: { id: token.user_id } });
        if (!user || !user.is_active) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const accessToken = await this.generateAccessToken({ role: user.role, sub: user.id });
        return accessToken;
    }
    async generateRefreshToken(userId: string, deviceInfo?: string) {
        const token = randomBytes(48).toString('base64url');
        const hashToken = createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date();
        const expiresInDays = this.configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRES_DAYS');
        if (!Number.isInteger(expiresInDays) || expiresInDays <= 0) {
            throw new Error('Refresh token expires days must be a positive integer');
        }
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        await this.prismaService.refresh_tokens.create({
            data: {
                user_id: userId,
                token_hash: hashToken,
                device_info: deviceInfo,
                expires_at: expiresAt

            }
        })
        return token;
    }
}
