import { type z } from "zod";

import { type planOverrideSchema } from "./plan-override.schema";

export type PlanOverride = z.infer<typeof planOverrideSchema>;
