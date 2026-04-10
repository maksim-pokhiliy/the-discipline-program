import { type z } from "zod";

import { type adminUserViewSchema } from "./admin-user-view.schema";

export type AdminUserView = z.infer<typeof adminUserViewSchema>;
