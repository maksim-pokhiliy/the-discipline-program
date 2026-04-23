import { type z } from "zod";

import {
  type createSchemeSchema,
  type schemeSchema,
  type updateSchemeSchema,
} from "./scheme.schema";

export type Scheme = z.infer<typeof schemeSchema>;
export type CreateSchemeData = z.infer<typeof createSchemeSchema>;
export type UpdateSchemeData = z.infer<typeof updateSchemeSchema>;
