import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { PrismaService } from "../../../prisma/prisma.service";
import { UnauthorizedException } from "@nestjs/common";

type validatePayload = {
    user: {
        sub: string,
        role: 'admin' | 'customer' | 'staff',

    }
}
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService, private prismaService: PrismaService) {
        super({
            jwtFromRequest:,
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            algorithms: ['HS256']
        });
    }
    validate(payload: validatePayload) {
        const user = await this.prismaService.users.findUnique({where:{id:payload.user.sub,is_active:true}});
        if(!user)
            return new  UnauthorizedException('Invalid credentials');
        return {id:user.id,role:user.role};
    }
}