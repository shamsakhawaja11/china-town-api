import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user-dto';

@Controller('auth')
export class AuthController {
    constructor(private authService:AuthService) {}
    @Post('register')
    register(@Body() dto:RegisterUserDto) {
        return this.authService.register(dto);
    }
}
