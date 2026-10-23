import { Module } from "@nestjs/common";
import { MenuItemsController } from "./menu-items.controller";
import { MenuItemsService } from "./menu-item.service";
import { MenuItemsPublicController } from "./menu-items.public.controller";

@Module({
    imports: [],
    controllers: [MenuItemsController, MenuItemsPublicController],
    providers: [MenuItemsService],
    exports: []
})
export class MenuItemsModule { }