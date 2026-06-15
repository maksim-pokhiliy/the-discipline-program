import { type z } from "zod";

import {
  type coachCredentialSchema,
  type createCoachCredentialSchema,
  type updateCoachCredentialSchema,
} from "./coach-credential.schema";

export type CoachCredential = z.infer<typeof coachCredentialSchema>;
export type CreateCoachCredentialData = z.infer<typeof createCoachCredentialSchema>;
export type UpdateCoachCredentialData = z.infer<typeof updateCoachCredentialSchema>;
