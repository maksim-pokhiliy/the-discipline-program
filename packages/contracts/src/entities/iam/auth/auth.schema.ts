import { z } from "zod";

import { AUTH_CONSTANTS, UserRole } from "./auth.constants";

export const userRoleSchema = z.nativeEnum(UserRole);

export const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(
      AUTH_CONSTANTS.MIN_PASSWORD_LENGTH,
      `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
    )
    .max(
      AUTH_CONSTANTS.MAX_PASSWORD_LENGTH,
      `Password must be at most ${AUTH_CONSTANTS.MAX_PASSWORD_LENGTH} characters`,
    ),
});
