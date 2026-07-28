import { z } from "zod";

import {
  createIndividualMobileLinkSchema,
  createMobileLinkSchema,
  mobileLinkSchema,
} from "./mobile-link.schema";

export const createMobileLinkRequestSchema = z.union([
  createIndividualMobileLinkSchema,
  createMobileLinkSchema,
]);
export const createMobileLinkResponseSchema = mobileLinkSchema;
export const getMobileLinksResponseSchema = z.array(mobileLinkSchema);
export const getMobileLinksQuerySchema = z.object({
  planId: z.string().cuid(),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart must be YYYY-MM-DD")
    .optional(),
});
export const deleteMobileLinkParamsSchema = z.object({ linkId: z.string().cuid() });
