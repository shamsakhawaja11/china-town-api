import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtUserType } from "../types/jwt-user.type";
import { Request } from "express";

export const CurrentUser = createParamDecorator(
    (data: keyof JwtUserType | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request & { user?: JwtUserType }>();

        return data ? request.user?.[data] : request.user
    },
)