import { type z } from "zod";

import {
  type createExerciseLogInputSchema,
  type createExerciseLogResponseSchema,
  type exerciseLogIdParamSchema,
  type getExerciseLogResponseSchema,
  type listExerciseLogsQuerySchema,
  type listExerciseLogsResponseSchema,
  type updateExerciseLogInputSchema,
  type updateExerciseLogResponseSchema,
} from "./exercise-log-api.schema";

export type CreateExerciseLogInput = z.infer<typeof createExerciseLogInputSchema>;
export type UpdateExerciseLogInput = z.infer<typeof updateExerciseLogInputSchema>;
export type ExerciseLogIdParam = z.infer<typeof exerciseLogIdParamSchema>;
export type ListExerciseLogsQuery = z.infer<typeof listExerciseLogsQuerySchema>;
export type ListExerciseLogsResponse = z.infer<typeof listExerciseLogsResponseSchema>;
export type GetExerciseLogResponse = z.infer<typeof getExerciseLogResponseSchema>;
export type CreateExerciseLogResponse = z.infer<typeof createExerciseLogResponseSchema>;
export type UpdateExerciseLogResponse = z.infer<typeof updateExerciseLogResponseSchema>;
