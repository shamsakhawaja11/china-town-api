import { Module } from "@nestjs/common";
import { MenuCategoriesController } from "./menu-categories.controller";
import { MenuCategoriesService } from "./menu-categories.service";
import { MenuCategoriesAdminController } from "./menu-categories-admin.controller";

@Module({
    imports: [],
    controllers: [MenuCategoriesController, MenuCategoriesAdminController],
    providers: [MenuCategoriesService],
    exports: []
})
export class MenuModule { }