import { Module } from "@nestjs/common";
import { MenuCategoriesController } from "./menu-categories.controller";
import { MenuCategoriesService } from "./menu-categories.service";

@Module({
    imports: [],
    controllers: [MenuCategoriesController],
    providers: [MenuCategoriesService],
    exports: []
})
export class MenuCategoriesModule { }