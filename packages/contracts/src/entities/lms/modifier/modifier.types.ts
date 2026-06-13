import { type z } from "zod";

import {
  type createModifierSchema,
  type modifierSchema,
  type updateModifierSchema,
} from "./modifier.schema";

export type Modifier = z.infer<typeof modifierSchema>;

export type ModifierRef = Modifier;

export type CreateModifierData = z.infer<typeof createModifierSchema>;

export type UpdateModifierData = z.infer<typeof updateModifierSchema>;
