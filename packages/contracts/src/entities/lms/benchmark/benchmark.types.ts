import { type z } from "zod";

import { type benchmarkSchema } from "./benchmark.schema";

export type Benchmark = z.infer<typeof benchmarkSchema>;
