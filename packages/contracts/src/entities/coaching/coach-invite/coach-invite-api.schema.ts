import { z } from "zod";

import { idParamSchema } from "../../../common";
import { userSchema } from "../../iam/user";

import { createCoachInviteSchema } from "./coach-invite.schema";

export const createCoachInviteRequestSchema = createCoachInviteSchema;

export const createCoachInviteResponseSchema = userSchema;

export const resendCoachInviteParamsSchema = idParamSchema;

export const resendCoachInviteResponseSchema = z.object({
  expiresAt: z.date(),
});
