import { type z } from "zod";

import {
  type createLabelRequestSchema,
  type deleteLabelParamsSchema,
  type getLabelByIdParamsSchema,
  type getLabelsPageDataResponseSchema,
  type getLabelsResponseSchema,
  type updateLabelParamsSchema,
  type updateLabelRequestSchema,
} from "./label-api.schema";

export type GetLabelsResponse = z.infer<typeof getLabelsResponseSchema>;

export type GetLabelByIdParams = z.infer<typeof getLabelByIdParamsSchema>;

export type CreateLabelRequest = z.infer<typeof createLabelRequestSchema>;

export type UpdateLabelParams = z.infer<typeof updateLabelParamsSchema>;

export type UpdateLabelRequest = z.infer<typeof updateLabelRequestSchema>;

export type DeleteLabelParams = z.infer<typeof deleteLabelParamsSchema>;

export type GetLabelsPageDataResponse = z.infer<typeof getLabelsPageDataResponseSchema>;

export type AdminLabelsPageData = GetLabelsPageDataResponse;
