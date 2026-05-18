import { z } from "zod";

export const MEDIA_POSITIONS = ["inline", "standalone_row", "bare"] as const;

export const MEDIA_APPLIES_TO = [
  "previous_row",
  "current_row",
  "whole_schema",
  "drop_stage",
] as const;

export const POSITION_EQUIPMENT_MODIFIERS = [
  "NEUTRAL_GRIP",
  "FROM_SOFA",
  "FROM_BOX",
  "FROM_BOX_OR_SOFA",
  "FROM_SOFA_BOX",
  "WITHOUT_BENCH",
  "WITHOUT_JUMP",
  "HOLD_FARM_CARRY",
  "HAND_ON_DB",
  "HANDS_ON_DB",
  "HAND_ON_DB_NEUTRAL_GRIP",
] as const;

export const mediaReferenceSchema = z.object({
  url: z.string().url(),
  position: z.enum(MEDIA_POSITIONS),
  label: z.string().min(1).optional(),
  appliesTo: z.enum(MEDIA_APPLIES_TO),
});

export const positionEquipmentModifierSchema = z.enum(POSITION_EQUIPMENT_MODIFIERS);

export type MediaReference = z.infer<typeof mediaReferenceSchema>;
export type MediaPosition = (typeof MEDIA_POSITIONS)[number];
export type MediaAppliesTo = (typeof MEDIA_APPLIES_TO)[number];
export type PositionEquipmentModifier = (typeof POSITION_EQUIPMENT_MODIFIERS)[number];
