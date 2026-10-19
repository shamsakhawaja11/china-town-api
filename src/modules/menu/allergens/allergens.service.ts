import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AllergensService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const allergens = await this.prisma.allergens.findMany({
            select: {
                id: true,
                name: true,
                description: true,
            },
            orderBy: { name: 'asc' }
        });
        return allergens;
    }
}