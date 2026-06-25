import { z } from "zod";

import { createMobileLinkSchema, mobileLinkSchema } from "./mobile-link.schema";

export const createMobileLinkRequestSchema = createMobileLinkSchema;
export const createMobileLinkResponseSchema = mobileLinkSchema;
export const getMobileLinksResponseSchema = z.array(mobileLinkSchema);
