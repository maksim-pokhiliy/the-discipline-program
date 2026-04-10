import { type z } from "zod";

import {
  type adminUserListItemSchema,
  type adminUserSchema,
  type updateUserRoleSchema,
  type userSearchResultSchema,
} from "./user.schema";

export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;
export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;
