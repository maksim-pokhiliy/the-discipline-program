import { type z } from "zod";

import {
  type publishMobileRequestSchema,
  type publishMobileResponseSchema,
} from "./mobile-publish-api.schema";

export type PublishMobileRequest = z.infer<typeof publishMobileRequestSchema>;
export type PublishMobileResponse = z.infer<typeof publishMobileResponseSchema>;
