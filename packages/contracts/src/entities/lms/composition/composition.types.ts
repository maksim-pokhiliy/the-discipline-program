import { type z } from "zod";

import {
  type benchmarkSchema,
  type composeContainerSchema,
  type composeRowSchema,
  type compositionSchema,
  type repetitionAxisSchema,
  type restAxisSchema,
} from "./composition.schema";

export type RepetitionAxis = z.infer<typeof repetitionAxisSchema>;
export type RestAxis = z.infer<typeof restAxisSchema>;
export type Benchmark = z.infer<typeof benchmarkSchema>;
export type Composition = z.infer<typeof compositionSchema>;
export type ComposeRow = z.infer<typeof composeRowSchema>;
export type ComposeContainer = z.infer<typeof composeContainerSchema>;
