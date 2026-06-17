import { z } from "zod";

import {
  createPerformedSchemaResultSchema,
  performedSchemaResultSchema,
} from "./performed-schema-result.schema";

export const performedSchemaResultParamsSchema = z.object({
  performedSessionId: z.string().cuid(),
});

export const createPerformedSchemaResultRequestSchema = createPerformedSchemaResultSchema;

export const createPerformedSchemaResultResponseSchema = performedSchemaResultSchema;
