import { z } from "zod";

import { EQUIPMENT_CONSTANTS } from "./equipment.constants";

const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\uFEFF|\u2060/g;

const normalizeText = (raw: string): string => raw.normalize("NFKC").replace(ZERO_WIDTH_RE, "");

const normalizedString = (max: number) =>
  z.string().transform(normalizeText).pipe(z.string().trim().min(1).max(max));

export const equipmentSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(EQUIPMENT_CONSTANTS.MAX_NAME_LENGTH),
  nameLower: z.string(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const equipmentFormBase = z.object({
  name: normalizedString(EQUIPMENT_CONSTANTS.MAX_NAME_LENGTH),
  notes: z.string().max(EQUIPMENT_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const createEquipmentSchema = equipmentFormBase;

export const updateEquipmentSchema = equipmentFormBase.partial();

export const equipmentRefSchema = equipmentSchema;
