import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeContact } from '../../common/utils/normalize-contact';
import { PrismaClientKnownRequestError } from '../../generated/prisma/internal/prismaNamespace';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    private normalizeField(raw: string | undefined | null, expected: 'email' | 'phone'): string | undefined {
        if (raw === undefined || raw === null || raw.trim() === '') {
            return undefined;
        }
        const result = normalizeContact(raw);
        if (!result || result.type !== expected) {
            throw new BadRequestException(`Invalid ${expected}`);
        }
        return result.value;
    }

    async create(name: string, hashPassword: string, email?: string, phone?: string) {
        const normalizedEmail = this.normalizeField(email, 'email');
        const normalizedPhone = this.normalizeField(phone, 'phone');

        if (!normalizedEmail && !normalizedPhone) {
            throw new BadRequestException('Either email or phone is required');
        }

        try {
            return await this.prisma.users.create({
                data: {
                    name,
                    password_hash: hashPassword,
                    email: normalizedEmail,
                    phone: normalizedPhone
                },
                omit: { password_hash: true },
            });
        } catch (err: any) {
            if (err instanceof PrismaClientKnownRequestError && err?.code === 'P2002') {
                throw new ConflictException('An account with these details already exists');
            }
            throw err;
        }
    }
}