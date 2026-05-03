import { z } from "zod";

import { benchmarkSourceSchema } from "../_domain/benchmark-source.schema";
import { prKindSchema } from "../_domain/pr-kind.schema";

import { BENCHMARK_CONSTANTS } from "./benchmark.constants";

export const benchmarkSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  kind: prKindSchema,
  value: z.number(),
  unit: z.string().min(1).max(BENCHMARK_CONSTANTS.MAX_UNIT_LENGTH),
  source: benchmarkSourceSchema,
  setBy: z.string().cuid(),
  setAt: z.date(),
  notes: z.string().max(BENCHMARK_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
