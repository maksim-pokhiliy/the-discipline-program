import { z } from "zod";

import {
  ALTERNATIVES_NO_PRIMARY_MESSAGE,
  ALTERNATIVES_UNIQUE_MESSAGE,
  altsExcludePrimary,
  createPlanItemBaseSchema,
  hasUniqueAlternativeIds,
} from "./plan-item.schema";

export const planItemForUpsertSchema = createPlanItemBaseSchema
  .omit({ blockId: true })
  .extend({ id: z.string().cuid().optional() })
  .refine((data) => hasUniqueAlternativeIds(data.alternatives), {
    message: ALTERNATIVES_UNIQUE_MESSAGE,
    path: ["alternatives"],
  })
  .refine((data) => altsExcludePrimary(data.alternatives, data.exerciseId), {
    message: ALTERNATIVES_NO_PRIMARY_MESSAGE,
    path: ["alternatives"],
  });
