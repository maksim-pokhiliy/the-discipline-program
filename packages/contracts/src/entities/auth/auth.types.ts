import { type z } from "zod";

import { type loginFormSchema } from "./auth.schema";

export type LoginFormData = z.infer<typeof loginFormSchema>;
