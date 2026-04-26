import { z } from "zod";

export const workoutSessionStatusSchema = z.enum([
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
  "SKIPPED",
]);
