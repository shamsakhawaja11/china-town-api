import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';

type AuthenticatedRequest = Request & {
    user: {
        id: string,
        role: 'admin' | 'customer' | 'staff'
    }
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }
    @Public()
    @Post('register')
    register(@Body() dto: RegisterUserDto) {
        return this.authService.register(dto);
    }

    @HttpCode(200)
    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Req() req: AuthenticatedRequest, @Body() dto: LoginUserDto) {
        return this.authService.createSession(req.user, dto.deviceInfo);
    }
    @HttpCode(200)
    @Public()
    @Post('refresh')
    refresh(@Body() token:RefreshTokenDto){
        return this.authService.refreshSession(token.refreshToken);
    }

}
