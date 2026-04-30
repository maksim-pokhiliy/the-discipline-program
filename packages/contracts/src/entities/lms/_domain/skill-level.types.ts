import { type z } from "zod";

import { type skillLevelSchema } from "./skill-level.schema";

export type SkillLevel = z.infer<typeof skillLevelSchema>;

export const SKILL_LEVELS: readonly SkillLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ELITE",
] as const;
