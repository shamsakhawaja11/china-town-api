import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users/me')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    profile(@CurrentUser('id') userId: string) {
        return this.usersService.profile(userId);
    }

    @Patch()
    update(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(userId, dto);
    }
}
