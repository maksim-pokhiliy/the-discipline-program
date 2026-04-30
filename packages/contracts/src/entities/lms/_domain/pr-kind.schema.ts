import { z } from "zod";

export const prKindSchema = z.enum([
  "ONE_REP_MAX",
  "N_REP_MAX",
  "MAX_REPS_UNBROKEN",
  "MAX_REPS_TOTAL",
  "BEST_TIME_FOR_X",
  "MAX_DISTANCE_IN_T",
  "MAX_CALORIES_IN_T",
  "MAX_LOAD_FOR_REPS",
]);
