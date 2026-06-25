import { type z } from "zod";

import {
  type publishDayResultSchema,
  type publishMobileResultSchema,
  type publishMobileSchema,
} from "./mobile-publish.schema";

export type PublishDayResult = z.infer<typeof publishDayResultSchema>;
export type PublishMobileData = z.infer<typeof publishMobileSchema>;
export type PublishMobileResult = z.infer<typeof publishMobileResultSchema>;
export type MobilePublishAction = PublishDayResult["action"];
