import { type z } from "zod";

import { type lmsSessionSchema } from "./lms-session.schema";

export type LmsSession = z.infer<typeof lmsSessionSchema>;
