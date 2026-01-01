import { z } from "zod";
import { loginFormSchema, userSchema } from "./auth.schema";

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type User = z.infer<typeof userSchema>;
export type UserRole = "ADMIN" | "EDITOR";
