import { Controller, Get } from "@nestjs/common";
import { AllergensService } from "./allergens.service";
import { Public } from "../../../common/decorators/public.decorator";

@Controller('menu/allergens')
export class AllergensController {
    constructor(private allergensService: AllergensService) { }

    @Public()
    @Get()
    findAll() {
        return this.allergensService.findAll();
    }
}