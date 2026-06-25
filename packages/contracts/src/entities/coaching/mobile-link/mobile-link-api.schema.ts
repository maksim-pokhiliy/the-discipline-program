import { z } from "zod";

import { createMobileLinkSchema, mobileLinkSchema } from "./mobile-link.schema";

export const createMobileLinkRequestSchema = createMobileLinkSchema;
export const createMobileLinkResponseSchema = mobileLinkSchema;
export const getMobileLinksResponseSchema = z.array(mobileLinkSchema);
export const getMobileLinksQuerySchema = z.object({ planId: z.string().cuid() });
export const deleteMobileLinkParamsSchema = z.object({ linkId: z.string().cuid() });
