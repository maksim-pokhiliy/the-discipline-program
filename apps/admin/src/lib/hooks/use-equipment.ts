"use client";

import {
  type AdminEquipmentPageData,
  type CreateEquipmentData,
  type Equipment,
  type UpdateEquipmentData,
} from "@repo/contracts/lms/equipment";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const equipmentHooks = createCrudHooks<
  AdminEquipmentPageData,
  Equipment,
  CreateEquipmentData,
  UpdateEquipmentData
>({
  entityName: "Equipment",
  keys: adminKeys.equipment,
  api: {
    getPageData: api.equipment.getPageData,
    getById: api.equipment.getById,
    create: api.equipment.create,
    update: api.equipment.update,
    delete: api.equipment.delete,
  },
  redirectTo: "/equipment",
  useNavigate,
});

export const useEquipmentPageData = equipmentHooks.usePageData;
export const useEquipmentItem = equipmentHooks.useById;
export const useCreateEquipment = equipmentHooks.useCreate;
export const useUpdateEquipment = equipmentHooks.useUpdate;
export const useDeleteEquipment = equipmentHooks.useDelete;
