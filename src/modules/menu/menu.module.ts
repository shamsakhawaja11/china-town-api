import { Module } from "@nestjs/common";
import { MenuCategoriesController } from "./menu-categories.controller";
import { MenuCategoriesService } from "./menu-categories.service";
import { MenuCategoriesAdminController } from "./menu-categories-admin.controller";
import { IngredientsModule } from "./ingredients/ingredients.module";
import { AllergensModule } from "./allergens/allergens.module";
import { MenuItemsModule } from "./menu-items/menu-items.module";

@Module({
    imports: [IngredientsModule, AllergensModule, MenuItemsModule],
    controllers: [MenuCategoriesController, MenuCategoriesAdminController],
    providers: [MenuCategoriesService],
    exports: []
})
export class MenuModule { }