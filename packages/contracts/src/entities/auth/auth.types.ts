import { type z } from "zod";

import { type loginFormSchema, type userRoleSchema, type userSchema } from "./auth.schema";

export type LoginFormData = z.infer<typeof loginFormSchema>;

export type User = z.infer<typeof userSchema>;

export type UserRole = z.infer<typeof userRoleSchema>;
