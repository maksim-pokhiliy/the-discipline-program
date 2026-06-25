import { type z } from "zod";

import { type createMobileLinkSchema, type mobileLinkSchema } from "./mobile-link.schema";

export type MobileLink = z.infer<typeof mobileLinkSchema>;
export type CreateMobileLinkData = z.infer<typeof createMobileLinkSchema>;
