import { type z } from "zod";

import {
  type createRowGroupRequestSchema,
  type rowGroupSchema,
  type updateRowGroupRequestSchema,
} from "./row-group.schema";

export type RowGroup = z.infer<typeof rowGroupSchema>;
export type CreateRowGroupRequest = z.infer<typeof createRowGroupRequestSchema>;
export type UpdateRowGroupRequest = z.infer<typeof updateRowGroupRequestSchema>;
