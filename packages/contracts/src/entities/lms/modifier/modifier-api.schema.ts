import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createModifierSchema, modifierSchema, updateModifierSchema } from "./modifier.schema";

export const getModifiersResponseSchema = z.array(modifierSchema);

export const getModifierByIdParamsSchema = idParamSchema;

export const createModifierRequestSchema = createModifierSchema;

export const updateModifierParamsSchema = idParamSchema;

export const updateModifierRequestSchema = updateModifierSchema;

export const deleteModifierParamsSchema = idParamSchema;

export const modifierSearchParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
});

export const getModifiersPageDataResponseSchema = z.object({
  modifiers: getModifiersResponseSchema,
});
