import { Module } from "@nestjs/common";
import { MenuItemsController } from "./menu-items.controller";
import { MenuItemsService } from "./menu-item.service";

@Module({
    imports: [],
    controllers: [MenuItemsController],
    providers: [MenuItemsService],
    exports: []
})
export class MenuItemsModule { }