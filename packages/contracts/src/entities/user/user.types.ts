import { type z } from "zod";

import {
  type adminUserListItemSchema,
  type adminUserSchema,
  type updateUserRoleSchema,
} from "./user.schema";

export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;
export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;
