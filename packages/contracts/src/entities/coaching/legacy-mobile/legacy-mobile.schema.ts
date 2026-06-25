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
  trainingLevel: legacyTrainingLevelSchema,
  isRestDay: z.boolean(),
  dailyProgram: legacyDailyProgramSchema.nullable(),
});
