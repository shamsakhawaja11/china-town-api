import { ConfigModule } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { envValidationSchema } from './config/env.validation';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SpecializationsModule } from './modules/specializations/specializations.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { StaffModule } from './modules/staff/staff.module';
import { MenuModule } from './modules/menu/menu.module';
import { TableCategoriesModule } from './modules/tables/table-categories/table-categories.module';
import { FloorPlansModule } from './modules/tables/floor-plans/floor-plans.module';
import { RestaurantsTablesModule } from './modules/tables/restaurant-tables/restaurant-tables.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AccessModule } from './common/access/access.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,  
    }),
    SpecializationsModule,
    UsersModule, RestaurantsModule, StaffModule, MenuModule,
    TableCategoriesModule, FloorPlansModule, RestaurantsTablesModule,
    UploadsModule,
    AccessModule, NotificationsModule, WalletModule, PaymentsModule,
    OrdersModule, KitchenModule, InventoryModule, ReservationsModule,
    ReviewsModule, DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
