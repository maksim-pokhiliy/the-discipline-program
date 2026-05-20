import { z } from "zod";

import { ALTERNATING_GROUP_RELATIONS } from "./alternating-group.constants";

export const alternatingGroupRelationSchema = z.enum(ALTERNATING_GROUP_RELATIONS);

export const alternatingGroupSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  relationKind: alternatingGroupRelationSchema,
  schemaIds: z.array(z.string().cuid()).min(2),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAlternatingGroupSchema = z.object({
  relationKind: alternatingGroupRelationSchema,
  schemaIds: z
    .array(z.string().cuid())
    .min(2)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "schemaIds must be unique",
    }),
});
