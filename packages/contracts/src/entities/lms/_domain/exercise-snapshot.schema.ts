import { z } from "zod";

import { bodyPartSchema } from "./body-part.schema";
import { modalitySchema } from "./modality.schema";
import { movementPatternSchema } from "./movement-pattern.schema";

export const exerciseSnapshotSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  primaryMovement: movementPatternSchema,
  modality: modalitySchema,
  primaryBodyParts: z.array(bodyPartSchema),
  defaultMetrics: z.unknown(),
  demoVideoUrl: z.string().url().nullable(),
  demoImageUrl: z.string().url().nullable(),
});
