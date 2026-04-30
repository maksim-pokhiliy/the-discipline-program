import { type z } from "zod";

import {
  type createSetLogInputSchema,
  type createSetLogResponseSchema,
  type getSetLogResponseSchema,
  type listSetLogsQuerySchema,
  type listSetLogsResponseSchema,
  type setLogIdParamSchema,
  type updateSetLogInputSchema,
  type updateSetLogResponseSchema,
} from "./set-log-api.schema";

export type CreateSetLogInput = z.infer<typeof createSetLogInputSchema>;
export type UpdateSetLogInput = z.infer<typeof updateSetLogInputSchema>;
export type SetLogIdParam = z.infer<typeof setLogIdParamSchema>;
export type ListSetLogsQuery = z.infer<typeof listSetLogsQuerySchema>;
export type ListSetLogsResponse = z.infer<typeof listSetLogsResponseSchema>;
export type GetSetLogResponse = z.infer<typeof getSetLogResponseSchema>;
export type CreateSetLogResponse = z.infer<typeof createSetLogResponseSchema>;
export type UpdateSetLogResponse = z.infer<typeof updateSetLogResponseSchema>;
