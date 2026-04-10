import { type z } from "zod";

import {
  type coachActionItemSchema,
  type healthReportMetadataSchema,
  type missedWorkoutsMetadataSchema,
  type newNoStartMetadataSchema,
} from "./coach-action-item.schema";

export type CoachActionItem = z.infer<typeof coachActionItemSchema>;
export type MissedWorkoutsMetadata = z.infer<typeof missedWorkoutsMetadataSchema>;
export type NewNoStartMetadata = z.infer<typeof newNoStartMetadataSchema>;
export type HealthReportMetadata = z.infer<typeof healthReportMetadataSchema>;
export type ActionItemMetadata = MissedWorkoutsMetadata | NewNoStartMetadata | HealthReportMetadata;
