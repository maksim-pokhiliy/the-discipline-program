import { z } from "zod";

import { resultSchema } from "../_shared";

export const performedSchemaResultSchema = z.object({
  id: z.string().cuid(),
  performedSessionId: z.string().cuid(),
  plannedSchemaId: z.string().cuid(),
  result: resultSchema,
  createdAt: z.date(),
});

export const createPerformedSchemaResultSchema = z.object({
  plannedSchemaId: z.string().cuid(),
  result: resultSchema,
});
