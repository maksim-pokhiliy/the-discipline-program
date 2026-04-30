import { type z } from "zod";

import { type bodyPartSchema } from "./body-part.schema";

export type BodyPart = z.infer<typeof bodyPartSchema>;

export const BODY_PARTS: readonly BodyPart[] = [
  "SHOULDERS",
  "CHEST",
  "BACK",
  "ARMS_BICEPS",
  "ARMS_TRICEPS",
  "CORE",
  "GLUTES",
  "HAMSTRINGS",
  "QUADS",
  "CALVES",
  "HIPS",
  "POSTERIOR_CHAIN",
  "FULL_BODY",
] as const;
