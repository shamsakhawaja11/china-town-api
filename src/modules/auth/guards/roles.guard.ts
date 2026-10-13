import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../../../common/decorators/roles.decorator";
import { user_role } from "../../../generated/prisma/enums";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }
    canActivate(context: ExecutionContext) {
        const roles = this.reflector.getAllAndOverride<user_role[] | undefined>(
            ROLES_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ],
        );
        if (!roles || roles.length == 0)
            return true;
        const request = context.switchToHttp().getRequest();

        const { user } = request.user;
        return !!user && roles.includes(user.role);
    }
}