import { type z } from "zod";

import {
  type arrangementAxisSchema,
  type composeContainerSchema,
  type composeNodeSchema,
  type composeRowSchema,
  type compositionSchema,
  type parallelTrackSchema,
  type repetitionAxisSchema,
  type restAxisSchema,
  type scoringConditionSchema,
  type scoringDirectiveSchema,
  type supersetPairSchema,
} from "./composition.schema";

export type RepetitionAxis = z.infer<typeof repetitionAxisSchema>;
export type ArrangementAxis = z.infer<typeof arrangementAxisSchema>;
export type ScoringDirective = z.infer<typeof scoringDirectiveSchema>;
export type ScoringCondition = z.infer<typeof scoringConditionSchema>;
export type RestAxis = z.infer<typeof restAxisSchema>;
export type Composition = z.infer<typeof compositionSchema>;
export type SupersetPair = z.infer<typeof supersetPairSchema>;
export type ParallelTrack = z.infer<typeof parallelTrackSchema>;
export type ComposeRow = z.infer<typeof composeRowSchema>;
export type ComposeContainer = z.infer<typeof composeContainerSchema>;
export type ComposeNode = z.infer<typeof composeNodeSchema>;
