import { userSchema } from "../../iam/user";

import { createCoachInviteSchema } from "./coach-invite.schema";

export const createCoachInviteRequestSchema = createCoachInviteSchema;

export const createCoachInviteResponseSchema = userSchema;
