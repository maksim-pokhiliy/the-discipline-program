import { type z } from "zod";

import { type featureSchema } from "./feature.schema";

export type Feature = z.infer<typeof featureSchema>;
