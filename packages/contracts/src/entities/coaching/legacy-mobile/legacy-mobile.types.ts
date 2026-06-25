import { type z } from "zod";

import {
  type legacyDailyProgramSchema,
  type legacyGeneralProgramSchema,
  type legacySigninResponseSchema,
  type legacyTrainingLevelSchema,
  type legacyTrainingLevelsSchema,
} from "./legacy-mobile.schema";

export type LegacySigninResponse = z.infer<typeof legacySigninResponseSchema>;
export type LegacyTrainingLevel = z.infer<typeof legacyTrainingLevelSchema>;
export type LegacyTrainingLevels = z.infer<typeof legacyTrainingLevelsSchema>;
export type LegacyDailyProgram = z.infer<typeof legacyDailyProgramSchema>;
export type LegacyGeneralProgram = z.infer<typeof legacyGeneralProgramSchema>;
