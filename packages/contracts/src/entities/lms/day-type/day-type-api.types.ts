import { type z } from "zod";

import {
  type createDayTypeRequestSchema,
  type createDayTypeResponseSchema,
  type deleteDayTypeParamsSchema,
  type getDayTypeByIdParamsSchema,
  type getDayTypeResponseSchema,
  type getDayTypesPageDataResponseSchema,
  type getDayTypesResponseSchema,
  type updateDayTypeParamsSchema,
  type updateDayTypeRequestSchema,
  type updateDayTypeResponseSchema,
} from "./day-type-api.schema";

export type GetDayTypesResponse = z.infer<typeof getDayTypesResponseSchema>;

export type GetDayTypeByIdParams = z.infer<typeof getDayTypeByIdParamsSchema>;

export type GetDayTypeResponse = z.infer<typeof getDayTypeResponseSchema>;

export type CreateDayTypeRequest = z.infer<typeof createDayTypeRequestSchema>;

export type CreateDayTypeResponse = z.infer<typeof createDayTypeResponseSchema>;

export type UpdateDayTypeParams = z.infer<typeof updateDayTypeParamsSchema>;

export type UpdateDayTypeRequest = z.infer<typeof updateDayTypeRequestSchema>;

export type UpdateDayTypeResponse = z.infer<typeof updateDayTypeResponseSchema>;

export type DeleteDayTypeParams = z.infer<typeof deleteDayTypeParamsSchema>;

export type GetDayTypesPageDataResponse = z.infer<typeof getDayTypesPageDataResponseSchema>;

export type AdminDayTypesPageData = GetDayTypesPageDataResponse;
