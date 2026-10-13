import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUserType } from '../../common/types/jwt-user.type';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('/register')
    register(@Body() dto: RegisterUserDto) {
        return this.authService.register(dto);
    }

    @HttpCode(200)
    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('/login')
    login(@CurrentUser() user: JwtUserType, @Body() dto: LoginUserDto) {
        return this.authService.createSession(user, dto.deviceInfo);
    }

    @HttpCode(200)
    @Public()
    @Post('/refresh')
    refresh(@Body() token: RefreshTokenDto) {
        return this.authService.refreshSession(token.refreshToken);
    }

    @Get('/me')
    me(@CurrentUser('id') id: string) {
        return this.authService.me(id);
    }

    @HttpCode(200)
    @Post('/logout')
    logout(@CurrentUser('id') userId: string, @Body() token: RefreshTokenDto) {
        return this.authService.logout(userId, token.refreshToken);
    }

    @HttpCode(200)
    @Post('/logout-all')
    logoutAll(@CurrentUser('id') userId: string) {
        return this.authService.logoutAll(userId);
    }

    @HttpCode(200)
    @Post('/change-password')
    changePassword(@CurrentUser('id') userId: string,@Body()dto:ChangePasswordDto) {
        return this.authService.changePassword(userId,dto);
    }

}
