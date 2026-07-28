import { type z } from "zod";

import {
  type createIndividualMobileLinkSchema,
  type createMobileLinkSchema,
  type generalMobileLinkSchema,
  type individualMobileLinkSchema,
  type mobileLinkSchema,
  type publishAggregateSchema,
} from "./mobile-link.schema";

export type MobileLinkPublishAggregate = z.infer<typeof publishAggregateSchema>;
export type MobileLink = z.infer<typeof mobileLinkSchema>;
export type GeneralMobileLink = z.infer<typeof generalMobileLinkSchema>;
export type IndividualMobileLink = z.infer<typeof individualMobileLinkSchema>;
export type CreateMobileLinkData = z.infer<typeof createMobileLinkSchema>;
export type CreateIndividualMobileLinkData = z.infer<typeof createIndividualMobileLinkSchema>;
