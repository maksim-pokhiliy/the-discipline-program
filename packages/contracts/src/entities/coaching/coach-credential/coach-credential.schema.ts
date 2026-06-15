import { z } from "zod";

import { COACH_CREDENTIAL_CONSTANTS } from "./coach-credential.constants";

export const coachCredentialSchema = z.object({
  id: z.string().cuid(),
  coachProfileId: z.string().cuid(),
  title: z.string(),
  issuer: z.string(),
  year: z.number().int(),
  shownToAthletes: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCoachCredentialSchema = z.object({
  title: z.string().min(1).max(COACH_CREDENTIAL_CONSTANTS.MAX_TITLE_LENGTH),
  issuer: z.string().min(1).max(COACH_CREDENTIAL_CONSTANTS.MAX_ISSUER_LENGTH),
  year: z.number().int().min(COACH_CREDENTIAL_CONSTANTS.MIN_YEAR),
  shownToAthletes: z.boolean(),
});

export const updateCoachCredentialSchema = z.object({
  title: z.string().min(1).max(COACH_CREDENTIAL_CONSTANTS.MAX_TITLE_LENGTH).optional(),
  issuer: z.string().min(1).max(COACH_CREDENTIAL_CONSTANTS.MAX_ISSUER_LENGTH).optional(),
  year: z.number().int().min(COACH_CREDENTIAL_CONSTANTS.MIN_YEAR).optional(),
  shownToAthletes: z.boolean().optional(),
});
