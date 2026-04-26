import { type z } from "zod";

import { type tempoSpecSchema } from "./tempo-spec.schema";

export type TempoSpec = z.infer<typeof tempoSpecSchema>;
