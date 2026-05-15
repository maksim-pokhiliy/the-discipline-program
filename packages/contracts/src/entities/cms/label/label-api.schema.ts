import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createLabelSchema, labelSchema, updateLabelSchema } from "./label.schema";

export const getLabelsResponseSchema = z.array(labelSchema);

export const getLabelByIdParamsSchema = idParamSchema;

export const createLabelRequestSchema = createLabelSchema;

export const updateLabelParamsSchema = idParamSchema;

export const updateLabelRequestSchema = updateLabelSchema;

export const deleteLabelParamsSchema = idParamSchema;

export const getLabelsPageDataResponseSchema = z.object({
  labels: getLabelsResponseSchema,
});
