import { type z } from "zod";

import { type passwordResetInfoSchema } from "./password-reset.schema";

export type PasswordResetInfo = z.infer<typeof passwordResetInfoSchema>;
