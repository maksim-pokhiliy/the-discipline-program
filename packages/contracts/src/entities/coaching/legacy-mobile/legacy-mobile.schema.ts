import { z } from "zod";

export const legacySigninResponseSchema = z.object({
  userId: z.union([z.number(), z.string()]).transform(String),
  accessToken: z.string().min(1),
  userRole: z.object({ id: z.number(), name: z.string() }),
  userPlan: z.object({ id: z.number(), name: z.string() }),
});

export const legacyTrainingLevelSchema = z.object({ id: z.number().int(), name: z.string() });

export const legacyTrainingLevelsSchema = z.array(legacyTrainingLevelSchema);

export const legacyDailyProgramSchema = z.object({
  dayTrainings: z.array(
    z.object({
      trainingNumber: z.number().int(),
      blocks: z.array(z.object({ name: z.string(), exercises: z.array(z.string()) })),
    }),
  ),
});

export const legacyGeneralProgramSchema = z.object({
  id: z.number().int(),
  scheduledDate: z.string(),
  trainingLevel: z.object({ id: z.number().int(), name: z.string().nullish() }),
  isRestDay: z.boolean(),
  dailyProgram: legacyDailyProgramSchema.nullable(),
});

export const legacyIndividualProgramSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  scheduledDate: z.string(),
  isRestDay: z.boolean(),
  dailyProgram: legacyDailyProgramSchema.nullable(),
});

export const legacyAthleteSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  trainingLevel: z.object({ id: z.number().int(), name: z.string().nullish() }).nullish(),
  userPlan: z.object({ id: z.number().int(), name: z.string().nullish() }).nullish(),
});

export const legacyAthletesSchema = z.array(legacyAthleteSchema);

export const mobileAthleteSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

export const mobileAthletesSchema = z.array(mobileAthleteSchema);
