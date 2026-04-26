import { type z } from "zod";

import {
  type createSetGroupInputSchema,
  type createSetGroupResponseSchema,
  type getSetGroupResponseSchema,
  type setGroupIdParamSchema,
  type updateSetGroupInputSchema,
  type updateSetGroupResponseSchema,
} from "./set-group-api.schema";

export type CreateSetGroupInput = z.infer<typeof createSetGroupInputSchema>;
export type UpdateSetGroupInput = z.infer<typeof updateSetGroupInputSchema>;
export type SetGroupIdParam = z.infer<typeof setGroupIdParamSchema>;
export type GetSetGroupResponse = z.infer<typeof getSetGroupResponseSchema>;
export type CreateSetGroupResponse = z.infer<typeof createSetGroupResponseSchema>;
export type UpdateSetGroupResponse = z.infer<typeof updateSetGroupResponseSchema>;
