import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { Prisma } from "../../generated/prisma/client";

type StaffWithUser = Prisma.staffGetPayload<{ include: { users: { select: { name: true, email: true, phone: true } } } }>;

@Injectable()
export class StaffService {

    constructor(private prismaService: PrismaService) { }

    async create(dto: CreateStaffDto) {
        try {
            const result = await this.prismaService.$transaction(async (tx) => {
                const user = await tx.users.findUnique({ where: { id: dto.userId } });

                if (!user) throw new NotFoundException('User not found');

                if (!user.is_active) throw new BadRequestException('User is not active');

                if (user.role === 'admin') throw new BadRequestException('Admin cant turn into staff');

                if (user.role === 'staff') throw new ConflictException('staff already exists');

                const branch = await tx.restaurants.findUnique({ where: { id: dto.restaurantId } });

                if (!branch) throw new NotFoundException('Restaurant branch not found');

                if (!branch.is_active) throw new BadRequestException('Branch is not active');

                await tx.users.update({ where: { id: user.id }, data: { role: 'staff' } });

                const staff = await tx.staff.create({
                    data: {
                        user_id: dto.userId,
                        restaurant_id: dto.restaurantId,
                        staff_type: dto.staffType,
                        position: dto.position
                    },include:{
                        users:{
                            select:{
                                name:true,
                                phone:true,
                                email:true
                            }
                        }
                    }
                });
                await tx.refresh_tokens.updateMany({
                    where: {
                        user_id: user.id,
                        revoked_at: null
                    },
                    data:
                        { revoked_at: new Date() }
                });
                return staff;
            });
            return this.toResponse(result);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                throw new ConflictException('users id already exists');
            }
            throw err;
        }
    }
    async toResponse(staff: StaffWithUser) {
        return {
            id: staff.id,
            name: staff.users.name,
            phone: staff.users.phone,
            email: staff.users?.email,
            restaurantId: staff.restaurant_id,
            staffType: staff.staff_type,
            position: staff.position,
            isAvailable: staff.is_available,
            isActive: staff.is_active
        }
    }
    
}