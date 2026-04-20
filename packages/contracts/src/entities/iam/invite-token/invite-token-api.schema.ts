import { z } from "zod";

import { idParamSchema } from "../../../common";
import { AUTH_CONSTANTS } from "../auth";

import { INVITE_TOKEN_CONSTANTS } from "./invite-token.constants";
import { inviteTokenSchema } from "./invite-token.schema";

const tokenParamSchema = z.object({
  token: z
    .string()
    .min(INVITE_TOKEN_CONSTANTS.MIN_TOKEN_LENGTH)
    .max(INVITE_TOKEN_CONSTANTS.MAX_TOKEN_LENGTH),
});

export const validateInviteParamsSchema = tokenParamSchema;

export const validateInviteResponseSchema = inviteTokenSchema;

export const consumeInviteParamsSchema = tokenParamSchema;

export const consumeInviteRequestSchema = z.object({
  password: z
    .string()
    .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
    .max(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH),
});

export const consumeInviteResponseSchema = z.object({
  userId: z.string().cuid(),
  redirectTo: z.string().startsWith("/").default("/dashboard"),
});

export const resendInviteParamsSchema = idParamSchema;

export const resendInviteResponseSchema = z.object({
  expiresAt: z.date(),
});
