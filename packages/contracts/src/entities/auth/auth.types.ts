import { type z } from "zod";

import { type loginFormSchema, type userSchema } from "./auth.schema";

export type LoginFormData = z.infer<typeof loginFormSchema>;

export type User = z.infer<typeof userSchema>;

export type UserRole = "ADMIN" | "EDITOR";
