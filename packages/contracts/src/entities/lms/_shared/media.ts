import { z } from "zod";

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
  label: z.string().min(1).optional(),
});

export const positionEquipmentModifierSchema = z.enum(POSITION_EQUIPMENT_MODIFIERS);

export type MediaReference = z.infer<typeof mediaReferenceSchema>;
export type PositionEquipmentModifier = (typeof POSITION_EQUIPMENT_MODIFIERS)[number];
