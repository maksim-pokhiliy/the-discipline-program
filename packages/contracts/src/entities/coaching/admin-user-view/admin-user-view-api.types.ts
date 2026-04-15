import { type z } from "zod";

import {
  type getAdminUserViewParamsSchema,
  type getAdminUserViewResponseSchema,
} from "./admin-user-view-api.schema";

export type GetAdminUserViewParams = z.infer<typeof getAdminUserViewParamsSchema>;
export type GetAdminUserViewResponse = z.infer<typeof getAdminUserViewResponseSchema>;
