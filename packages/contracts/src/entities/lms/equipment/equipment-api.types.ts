import { type z } from "zod";

import {
  type createEquipmentRequestSchema,
  type deleteEquipmentParamsSchema,
  type equipmentSearchParamsSchema,
  type getEquipmentByIdParamsSchema,
  type getEquipmentPageDataResponseSchema,
  type getEquipmentResponseSchema,
  type updateEquipmentParamsSchema,
  type updateEquipmentRequestSchema,
} from "./equipment-api.schema";

export type GetEquipmentResponse = z.infer<typeof getEquipmentResponseSchema>;

export type GetEquipmentByIdParams = z.infer<typeof getEquipmentByIdParamsSchema>;

export type CreateEquipmentRequest = z.infer<typeof createEquipmentRequestSchema>;

export type UpdateEquipmentParams = z.infer<typeof updateEquipmentParamsSchema>;

export type UpdateEquipmentRequest = z.infer<typeof updateEquipmentRequestSchema>;

export type DeleteEquipmentParams = z.infer<typeof deleteEquipmentParamsSchema>;

export type EquipmentSearchParams = z.infer<typeof equipmentSearchParamsSchema>;

export type GetEquipmentPageDataResponse = z.infer<typeof getEquipmentPageDataResponseSchema>;

export type AdminEquipmentPageData = GetEquipmentPageDataResponse;
