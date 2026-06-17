import { type z } from "zod";

import {
  type createPerformedSchemaResultSchema,
  type performedSchemaResultSchema,
} from "./performed-schema-result.schema";

export type PerformedSchemaResult = z.infer<typeof performedSchemaResultSchema>;
export type CreatePerformedSchemaResultData = z.infer<typeof createPerformedSchemaResultSchema>;
