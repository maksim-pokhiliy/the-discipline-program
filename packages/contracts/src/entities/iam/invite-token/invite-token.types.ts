import { type z } from "zod";

import { type inviteTokenSchema } from "./invite-token.schema";

export type InviteToken = z.infer<typeof inviteTokenSchema>;
