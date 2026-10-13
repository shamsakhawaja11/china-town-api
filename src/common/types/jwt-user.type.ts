import { user_role } from "../../generated/prisma/enums"

export type JwtUserType = {
    id: string,
    role: user_role,

};