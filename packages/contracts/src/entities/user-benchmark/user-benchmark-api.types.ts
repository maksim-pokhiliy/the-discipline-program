import { type z } from "zod";

import {
  type createUserBenchmarkRequestSchema,
  type createUserBenchmarkResponseSchema,
  type deleteUserBenchmarkParamsSchema,
  type getUserBenchmarkByIdParamsSchema,
  type getUserBenchmarkResponseSchema,
  type getUserBenchmarksParamsSchema,
  type getUserBenchmarksResponseSchema,
  type updateUserBenchmarkParamsSchema,
  type updateUserBenchmarkRequestSchema,
  type updateUserBenchmarkResponseSchema,
} from "./user-benchmark-api.schema";

export type GetUserBenchmarksParams = z.infer<typeof getUserBenchmarksParamsSchema>;
export type GetUserBenchmarksResponse = z.infer<typeof getUserBenchmarksResponseSchema>;
export type GetUserBenchmarkByIdParams = z.infer<typeof getUserBenchmarkByIdParamsSchema>;
export type GetUserBenchmarkResponse = z.infer<typeof getUserBenchmarkResponseSchema>;
export type CreateUserBenchmarkRequest = z.infer<typeof createUserBenchmarkRequestSchema>;
export type CreateUserBenchmarkResponse = z.infer<typeof createUserBenchmarkResponseSchema>;
export type UpdateUserBenchmarkParams = z.infer<typeof updateUserBenchmarkParamsSchema>;
export type UpdateUserBenchmarkRequest = z.infer<typeof updateUserBenchmarkRequestSchema>;
export type UpdateUserBenchmarkResponse = z.infer<typeof updateUserBenchmarkResponseSchema>;
export type DeleteUserBenchmarkParams = z.infer<typeof deleteUserBenchmarkParamsSchema>;
