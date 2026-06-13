import { type z } from "zod";

import {
  type createRowGroupResponseSchema,
  type rowGroupByIdParamsSchema,
  type rowGroupByPlanParamsSchema,
  type updateRowGroupResponseSchema,
} from "./row-group-api.schema";

export type RowGroupByPlanParams = z.infer<typeof rowGroupByPlanParamsSchema>;
export type RowGroupByIdParams = z.infer<typeof rowGroupByIdParamsSchema>;
export type CreateRowGroupResponse = z.infer<typeof createRowGroupResponseSchema>;
export type UpdateRowGroupResponse = z.infer<typeof updateRowGroupResponseSchema>;
