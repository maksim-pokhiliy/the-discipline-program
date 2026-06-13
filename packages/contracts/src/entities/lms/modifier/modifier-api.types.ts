import { type z } from "zod";

import {
  type createModifierRequestSchema,
  type deleteModifierParamsSchema,
  type getModifierByIdParamsSchema,
  type getModifiersPageDataResponseSchema,
  type getModifiersResponseSchema,
  type modifierSearchParamsSchema,
  type updateModifierParamsSchema,
  type updateModifierRequestSchema,
} from "./modifier-api.schema";

export type GetModifiersResponse = z.infer<typeof getModifiersResponseSchema>;

export type GetModifierByIdParams = z.infer<typeof getModifierByIdParamsSchema>;

export type CreateModifierRequest = z.infer<typeof createModifierRequestSchema>;

export type UpdateModifierParams = z.infer<typeof updateModifierParamsSchema>;

export type UpdateModifierRequest = z.infer<typeof updateModifierRequestSchema>;

export type DeleteModifierParams = z.infer<typeof deleteModifierParamsSchema>;

export type ModifierSearchParams = z.infer<typeof modifierSearchParamsSchema>;

export type GetModifiersPageDataResponse = z.infer<typeof getModifiersPageDataResponseSchema>;

export type AdminModifiersPageData = GetModifiersPageDataResponse;
