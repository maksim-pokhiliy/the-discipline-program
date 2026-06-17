import { type z } from "zod";

import {
  type createPerformedSchemaResultRequestSchema,
  type createPerformedSchemaResultResponseSchema,
  type performedSchemaResultParamsSchema,
} from "./performed-schema-result-api.schema";

export type PerformedSchemaResultParams = z.infer<typeof performedSchemaResultParamsSchema>;
export type CreatePerformedSchemaResultRequest = z.infer<
  typeof createPerformedSchemaResultRequestSchema
>;
export type CreatePerformedSchemaResultResponse = z.infer<
  typeof createPerformedSchemaResultResponseSchema
>;
