import { type z } from "zod";

import {
  type createMobileLinkRequestSchema,
  type createMobileLinkResponseSchema,
  type getMobileLinksResponseSchema,
} from "./mobile-link-api.schema";

export type CreateMobileLinkRequest = z.infer<typeof createMobileLinkRequestSchema>;
export type CreateMobileLinkResponse = z.infer<typeof createMobileLinkResponseSchema>;
export type GetMobileLinksResponse = z.infer<typeof getMobileLinksResponseSchema>;
