import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createEquipmentSchema, equipmentSchema, updateEquipmentSchema } from "./equipment.schema";

export const getEquipmentResponseSchema = z.array(equipmentSchema);

export const getEquipmentByIdParamsSchema = idParamSchema;

export const createEquipmentRequestSchema = createEquipmentSchema;

export const updateEquipmentParamsSchema = idParamSchema;

export const updateEquipmentRequestSchema = updateEquipmentSchema;

export const deleteEquipmentParamsSchema = idParamSchema;

export const equipmentSearchParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
});

export const getEquipmentPageDataResponseSchema = z.object({
  equipment: getEquipmentResponseSchema,
});
