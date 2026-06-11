import { z } from "zod";

import { schemaWithBodySchema } from "../schema";

import { schemaGroupSchema } from "./schema-group.schema";

export const groupByPlanParamsSchema = z.object({
  planId: z.string().cuid(),
});

export const groupByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  groupId: z.string().cuid(),
});

export const createGroupResponseSchema = z.object({
  group: schemaGroupSchema,
  members: z.array(schemaWithBodySchema),
});

export const updateGroupResponseSchema = schemaGroupSchema;
