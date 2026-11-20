import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { staff_type_enum } from '../../generated/prisma/enums';
import { JwtUserType } from '../types/jwt-user.type';

export type Actor = {
    userId: string;
    role: JwtUserType['role'];
    /** null for admins (admins are not rows in the staff table) */
    staffId: string | null;
    staffType: staff_type_enum | null;
    restaurantId: string | null;
};

/**
 * Role checks finer than the @Roles() decorator: staff are split into
 * chef / waiter / manager, and admins can do everything.
 */
@Injectable()
export class StaffAccessService {
    constructor(private readonly prisma: PrismaService) { }

    async getActor(user: JwtUserType): Promise<Actor> {
        if (user.role === 'admin') {
            return { userId: user.id, role: 'admin', staffId: null, staffType: null, restaurantId: null };
        }
        if (user.role !== 'staff') {
            throw new ForbiddenException('Staff access only');
        }
        const staff = await this.prisma.staff.findUnique({ where: { user_id: user.id } });
        if (!staff || !staff.is_active) {
            throw new ForbiddenException('Staff profile is missing or inactive');
        }
        return {
            userId: user.id,
            role: 'staff',
            staffId: staff.id,
            staffType: staff.staff_type,
            restaurantId: staff.restaurant_id,
        };
    }

    /** Admin always passes. Staff must be one of `types`. */
    async requireStaffTypes(user: JwtUserType, types: staff_type_enum[]): Promise<Actor> {
        const actor = await this.getActor(user);
        if (actor.role === 'admin') return actor;
        if (!actor.staffType || !types.includes(actor.staffType)) {
            throw new ForbiddenException(`Only ${types.join(' / ')} staff can do this`);
        }
        return actor;
    }
}
