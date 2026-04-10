import { type z } from "zod";

import {
  type createUserBenchmarkSchema,
  type updateUserBenchmarkSchema,
  type userBenchmarkSchema,
} from "./user-benchmark.schema";

export type UserBenchmark = z.infer<typeof userBenchmarkSchema>;
export type CreateUserBenchmarkData = z.infer<typeof createUserBenchmarkSchema>;
export type UpdateUserBenchmarkData = z.infer<typeof updateUserBenchmarkSchema>;
