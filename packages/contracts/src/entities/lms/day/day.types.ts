import { type z } from "zod";

import { type daySchema } from "./day.schema";

export type Day = z.infer<typeof daySchema>;
