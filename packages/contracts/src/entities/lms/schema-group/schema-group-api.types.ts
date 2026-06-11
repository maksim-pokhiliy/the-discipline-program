import { type z } from "zod";

import {
  type createGroupResponseSchema,
  type groupByIdParamsSchema,
  type groupByPlanParamsSchema,
  type updateGroupResponseSchema,
} from "./schema-group-api.schema";

export type GroupByPlanParams = z.infer<typeof groupByPlanParamsSchema>;
export type GroupByIdParams = z.infer<typeof groupByIdParamsSchema>;
export type CreateGroupResponse = z.infer<typeof createGroupResponseSchema>;
export type UpdateGroupResponse = z.infer<typeof updateGroupResponseSchema>;
