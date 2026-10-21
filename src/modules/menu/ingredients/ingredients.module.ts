import { Module } from "@nestjs/common";
import { IngredientController } from "./ingredients.controller";
import { IngredientsService } from "./ingredients.service";

@Module({
    imports:[],
    controllers:[IngredientController],
    providers:[IngredientsService],
    exports:[IngredientsService]
})
export class IngredientsModule { }