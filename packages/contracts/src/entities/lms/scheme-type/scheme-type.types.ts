import { type z } from "zod";

import {
  type createSchemeTypeSchema,
  type schemeTypeSchema,
  type updateSchemeTypeSchema,
} from "./scheme-type.schema";

export type SchemeType = z.infer<typeof schemeTypeSchema>;
export type CreateSchemeTypeData = z.infer<typeof createSchemeTypeSchema>;
export type UpdateSchemeTypeData = z.infer<typeof updateSchemeTypeSchema>;
