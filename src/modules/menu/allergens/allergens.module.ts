import { Module } from "@nestjs/common";
import { AllergensService } from "./allergens.service";

@Module({
    controllers: [AllergensModule],
    providers: [AllergensService],
    exports: [AllergensService],
})
export class AllergensModule { }