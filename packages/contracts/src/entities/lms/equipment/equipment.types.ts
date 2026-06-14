import { type z } from "zod";

import {
  type createEquipmentSchema,
  type equipmentSchema,
  type updateEquipmentSchema,
} from "./equipment.schema";

export type Equipment = z.infer<typeof equipmentSchema>;

export type EquipmentRef = Equipment;

export type CreateEquipmentData = z.infer<typeof createEquipmentSchema>;

export type UpdateEquipmentData = z.infer<typeof updateEquipmentSchema>;
