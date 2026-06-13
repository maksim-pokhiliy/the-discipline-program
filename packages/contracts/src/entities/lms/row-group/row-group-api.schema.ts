import { z } from "zod";

import { schemaRowSchema } from "../schema-row";

import { rowGroupSchema } from "./row-group.schema";

export const rowGroupByPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const rowGroupByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  rowGroupId: z.string().cuid(),
});

export const createRowGroupResponseSchema = z.object({
  group: rowGroupSchema,
  members: z.array(schemaRowSchema),
});

export const updateRowGroupResponseSchema = rowGroupSchema;
