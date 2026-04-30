import { z } from "zod";

export const bodyPartSchema = z.enum([
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
]);
