import { type z } from "zod";

import {
  type adminUserListItemSchema,
  type updateUserRoleSchema,
  type userSchema,
  type userSearchResultSchema,
} from "./user.schema";

export type User = z.infer<typeof userSchema>;
export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;
export type UpdateUserRoleData = z.infer<typeof updateUserRoleSchema>;
