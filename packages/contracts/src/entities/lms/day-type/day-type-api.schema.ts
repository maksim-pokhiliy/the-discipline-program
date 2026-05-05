import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createDayTypeSchema, dayTypeSchema, updateDayTypeSchema } from "./day-type.schema";

export const getDayTypesResponseSchema = z.array(dayTypeSchema);

export const getDayTypeByIdParamsSchema = idParamSchema;

export const getDayTypeResponseSchema = dayTypeSchema;

export const createDayTypeRequestSchema = createDayTypeSchema;

export const createDayTypeResponseSchema = dayTypeSchema;

export const updateDayTypeParamsSchema = idParamSchema;

export const updateDayTypeRequestSchema = updateDayTypeSchema;

export const updateDayTypeResponseSchema = dayTypeSchema;

export const deleteDayTypeParamsSchema = idParamSchema;

export const getDayTypesPageDataResponseSchema = z.object({
  dayTypes: getDayTypesResponseSchema,
});
