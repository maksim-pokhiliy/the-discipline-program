import { type z } from "zod";

import {
  type createCoachCredentialRequestSchema,
  type createCoachCredentialResponseSchema,
  type deleteCoachCredentialParamsSchema,
  type updateCoachCredentialParamsSchema,
  type updateCoachCredentialRequestSchema,
  type updateCoachCredentialResponseSchema,
} from "./coach-credential-api.schema";

export type CreateCoachCredentialRequest = z.infer<typeof createCoachCredentialRequestSchema>;
export type CreateCoachCredentialResponse = z.infer<typeof createCoachCredentialResponseSchema>;
export type UpdateCoachCredentialParams = z.infer<typeof updateCoachCredentialParamsSchema>;
export type UpdateCoachCredentialRequest = z.infer<typeof updateCoachCredentialRequestSchema>;
export type UpdateCoachCredentialResponse = z.infer<typeof updateCoachCredentialResponseSchema>;
export type DeleteCoachCredentialParams = z.infer<typeof deleteCoachCredentialParamsSchema>;
