import { type z } from "zod";

import {
  type legacyAthleteSchema,
  type legacyAthletesSchema,
  type legacyDailyProgramSchema,
  type legacyGeneralProgramSchema,
  type legacyIndividualProgramSchema,
  type legacySigninResponseSchema,
  type legacyTrainingLevelSchema,
  type legacyTrainingLevelsSchema,
} from "./legacy-mobile.schema";

export type LegacySigninResponse = z.infer<typeof legacySigninResponseSchema>;
export type LegacyTrainingLevel = z.infer<typeof legacyTrainingLevelSchema>;
export type LegacyTrainingLevels = z.infer<typeof legacyTrainingLevelsSchema>;
export type LegacyDailyProgram = z.infer<typeof legacyDailyProgramSchema>;
export type LegacyGeneralProgram = z.infer<typeof legacyGeneralProgramSchema>;
export type LegacyIndividualProgram = z.infer<typeof legacyIndividualProgramSchema>;
export type LegacyAthlete = z.infer<typeof legacyAthleteSchema>;
export type LegacyAthletes = z.infer<typeof legacyAthletesSchema>;
