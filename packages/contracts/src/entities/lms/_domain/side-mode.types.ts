import { type z } from "zod";

import { type sideModeSchema } from "./side-mode.schema";

export type SideMode = z.infer<typeof sideModeSchema>;

export const SIDE_MODES: readonly SideMode[] = [
  "BILATERAL",
  "EACH_ARM",
  "EACH_LEG",
  "ASYMMETRIC_HOLD",
  "UNILATERAL_ALTERNATING",
] as const;
