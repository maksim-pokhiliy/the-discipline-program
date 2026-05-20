import { type z } from "zod";

import {
  type createAlternatingGroupRequestSchema,
  type createAlternatingGroupResponseSchema,
  type deleteAlternatingGroupParamsSchema,
  type getAlternatingGroupsResponseSchema,
} from "./alternating-group-api.schema";

export type GetAlternatingGroupsResponse = z.infer<typeof getAlternatingGroupsResponseSchema>;
export type CreateAlternatingGroupRequest = z.infer<typeof createAlternatingGroupRequestSchema>;
export type CreateAlternatingGroupResponse = z.infer<typeof createAlternatingGroupResponseSchema>;
export type DeleteAlternatingGroupParams = z.infer<typeof deleteAlternatingGroupParamsSchema>;
