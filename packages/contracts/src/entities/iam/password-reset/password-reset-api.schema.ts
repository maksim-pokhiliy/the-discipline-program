import { z } from "zod";

import { AUTH_CONSTANTS } from "../auth";

import { PASSWORD_RESET_CONSTANTS } from "./password-reset.constants";
import { passwordResetInfoSchema } from "./password-reset.schema";

const passwordResetTokenParamSchema = z.object({
  token: z
    .string()
    .min(PASSWORD_RESET_CONSTANTS.MIN_TOKEN_LENGTH)
    .max(PASSWORD_RESET_CONSTANTS.MAX_TOKEN_LENGTH),
});

export const requestPasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const requestPasswordResetResponseSchema = z.object({
  success: z.literal(true),
});

export const validatePasswordResetParamsSchema = passwordResetTokenParamSchema;

export const validatePasswordResetResponseSchema = passwordResetInfoSchema;

export const consumePasswordResetParamsSchema = passwordResetTokenParamSchema;

export const consumePasswordResetRequestSchema = z.object({
  password: z
    .string()
    .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
    .max(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH),
});

export const consumePasswordResetResponseSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().startsWith("/"),
});
