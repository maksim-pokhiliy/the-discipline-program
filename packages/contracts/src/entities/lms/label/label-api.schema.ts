import { z } from "zod";

import { idParamSchema } from "../../../common";

import { appLevelSchema, createLabelSchema, labelSchema, updateLabelSchema } from "./label.schema";

export const getLabelsResponseSchema = z.array(labelSchema);

export const getLabelByIdParamsSchema = idParamSchema;

export const createLabelRequestSchema = createLabelSchema;

export const updateLabelParamsSchema = idParamSchema;

export const updateLabelRequestSchema = updateLabelSchema;

export const deleteLabelParamsSchema = idParamSchema;

export const labelSearchParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  level: appLevelSchema.optional(),
});

export const getLabelsPageDataResponseSchema = z.object({
  labels: getLabelsResponseSchema,
});
