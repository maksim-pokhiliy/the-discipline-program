import { z } from "zod";

import {
  coachCredentialSchema,
  createCoachCredentialSchema,
  updateCoachCredentialSchema,
} from "./coach-credential.schema";

export const credentialIdParamSchema = z.object({ credentialId: z.string().cuid() });

export const createCoachCredentialRequestSchema = createCoachCredentialSchema;
export const createCoachCredentialResponseSchema = coachCredentialSchema;

export const updateCoachCredentialParamsSchema = credentialIdParamSchema;
export const updateCoachCredentialRequestSchema = updateCoachCredentialSchema;
export const updateCoachCredentialResponseSchema = coachCredentialSchema;

export const deleteCoachCredentialParamsSchema = credentialIdParamSchema;
