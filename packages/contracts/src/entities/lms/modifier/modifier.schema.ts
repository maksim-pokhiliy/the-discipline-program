import { z } from "zod";

import { notesListSchema } from "../_shared";

import { MODIFIER_CONSTANTS } from "./modifier.constants";

const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\uFEFF|\u2060/g;

const normalizeText = (raw: string): string => raw.normalize("NFKC").replace(ZERO_WIDTH_RE, "");

const normalizedString = (max: number) =>
  z.string().transform(normalizeText).pipe(z.string().trim().min(1).max(max));

export const modifierSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(MODIFIER_CONSTANTS.MAX_NAME_LENGTH),
  nameLower: z.string(),
  notes: notesListSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const modifierFormBase = z.object({
  name: normalizedString(MODIFIER_CONSTANTS.MAX_NAME_LENGTH),
  notes: notesListSchema.nullable().optional(),
});

export const createModifierSchema = modifierFormBase;

export const updateModifierSchema = modifierFormBase.partial();

export const modifierRefSchema = modifierSchema;
