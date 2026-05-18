import { z } from "zod";

import { restSpecSchema } from "./cap-spec";
import { stageIndicatorSchema, stagedProgramKindSchema } from "./enums";
import { loadSchema } from "./load";
import { mediaReferenceSchema } from "./media";
import { repNotationSchema } from "./reps";

export const stageSchema = z.object({
  reps: z.union([z.number().int().positive(), repNotationSchema]),
  load: loadSchema.optional(),
  indicator: stageIndicatorSchema.optional(),
  label: z.string().min(1).optional(),
  media: mediaReferenceSchema.optional(),
});

export const stagedProgramSchema = z
  .object({
    programKind: stagedProgramKindSchema,
    stages: z.array(stageSchema).min(1),
    setsCount: z.number().int().positive().optional(),
    stageCountPerSet: z.number().int().positive().optional(),
    separatorForm: z.literal("...then...").optional(),
    mediaPerStage: z.record(z.string(), mediaReferenceSchema).optional(),
    restBetweenStages: restSpecSchema.optional(),
  })
  .refine(
    (p) =>
      p.programKind !== "cluster" ||
      (p.setsCount !== undefined && p.stageCountPerSet !== undefined),
    { message: "cluster programKind requires setsCount and stageCountPerSet" },
  );

export type Stage = z.infer<typeof stageSchema>;
export type StagedProgram = z.infer<typeof stagedProgramSchema>;
