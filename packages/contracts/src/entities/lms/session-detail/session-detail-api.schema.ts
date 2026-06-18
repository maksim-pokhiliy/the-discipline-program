import { z } from "zod";

import { sessionDetailViewSchema } from "./session-detail.schema";

export const sessionDetailParamsSchema = z.object({
  sessionId: z.string().cuid(),
});

export const sessionDetailResponseSchema = sessionDetailViewSchema;
