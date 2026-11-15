import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateFloorPlanDto } from "./dto/create-floor-plan.dto";
import { RestaurantsService } from "../../restaurants/restaurants.service";
import { Prisma } from "../../../generated/prisma/client";

@Injectable()
export class FloorPlansService {
    constructor(private prisma: PrismaService, private restaurantService: RestaurantsService) { }

    async create(dto: CreateFloorPlanDto) {

        const restaurant = await this.restaurantService.getDefaultRestaurant();
        const countOfFloor = await this.prisma.floor_plans.count({ where: { restaurant_id: restaurant.id, is_active: true } });
        const isDefault = countOfFloor > 0 ? false : true;
        try {
            return await this.prisma.floor_plans.create({
                data: {
                    name: dto.name,
                    restaurant_id: restaurant.id,
                    canvas_height: dto.canvasHeight,
                    canvas_width: dto.canvasWidth,
                    is_default: isDefault,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException(error.meta?.target);
            }
            throw error;
        }
    }

    async getAll(includeInactive = false) {
        const restaurant = await this.restaurantService.getDefaultRestaurant();
        const floor = await this.prisma.floor_plans.findMany({ where: { restaurant_id: restaurant.id, is_active: !includeInactive, orderBy: { is_default: 'desc', name: 'asc' } } });
        return floor
    }
}   