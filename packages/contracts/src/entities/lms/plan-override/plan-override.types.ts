import { type z } from "zod";

import { type planOverridePayloadSchema, type planOverrideSchema } from "./plan-override.schema";

export type PlanOverride = z.infer<typeof planOverrideSchema>;
export type PlanOverridePayload = z.infer<typeof planOverridePayloadSchema>;
