import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { PrismaService } from "../../../prisma/prisma.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExtractJwt } from 'passport-jwt';

type validatePayload = {
    sub: string,
    role: 'admin' | 'customer' | 'staff',

}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService, private prismaService: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            algorithms: ['HS256']
        });
    }
    async validate(payload: validatePayload) {
        const user = await this.prismaService.users.findUnique({ where: { id: payload.sub, is_active: true } });
        if (!user)
            throw new UnauthorizedException('Invalid credentials');
        return { id: user.id, role: user.role };
    }
}