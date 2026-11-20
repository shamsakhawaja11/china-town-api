import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    list(@CurrentUser('id') userId: string, @Query() query: ListNotificationsQueryDto) {
        return this.notificationsService.list(userId, query.page, query.limit, query.unreadOnly);
    }

    @Get('unread-count')
    unreadCount(@CurrentUser('id') userId: string) {
        return this.notificationsService.unreadCount(userId);
    }

    @HttpCode(200)
    @Patch('read-all')
    markAllRead(@CurrentUser('id') userId: string) {
        return this.notificationsService.markAllRead(userId);
    }

    @HttpCode(200)
    @Patch(':id/read')
    markRead(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.notificationsService.markRead(userId, id);
    }
}
