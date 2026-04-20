import { z } from "zod";

import { idParamSchema } from "../../../common";
import { timezoneSchema } from "../../../common/timezone";
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
  timezone: timezoneSchema.optional(),
});

export const consumeInviteResponseSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().startsWith("/"),
});

export const resendInviteParamsSchema = idParamSchema;

export const resendInviteResponseSchema = z.object({
  expiresAt: z.date(),
});
