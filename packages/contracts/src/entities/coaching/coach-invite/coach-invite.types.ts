import { type z } from "zod";

import { type createCoachInviteSchema } from "./coach-invite.schema";

export type CreateCoachInviteData = z.infer<typeof createCoachInviteSchema>;
