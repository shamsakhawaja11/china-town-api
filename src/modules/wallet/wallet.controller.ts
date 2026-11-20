import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TopUpWalletDto } from './dto/top-up-wallet.dto';

@Roles('customer')
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get()
    get(@CurrentUser('id') userId: string) {
        return this.walletService.getWallet(userId);
    }

    @Get('transactions')
    transactions(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
        return this.walletService.transactions(userId, query.page, query.limit);
    }

    @Post('top-up')
    topUp(@CurrentUser('id') userId: string, @Body() dto: TopUpWalletDto) {
        return this.walletService.topUp(userId, dto);
    }
}
