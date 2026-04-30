import { type z } from "zod";

import { type sessionTemplateSchema } from "./session-template.schema";

export type SessionTemplate = z.infer<typeof sessionTemplateSchema>;
