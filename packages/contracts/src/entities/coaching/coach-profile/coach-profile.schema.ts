import { z } from "zod";

import { imageUrlSchema } from "../../../common/image";
import { timezoneSchema } from "../../../common/timezone";
import { userRoleSchema } from "../../iam/auth";
import { coachCredentialSchema } from "../coach-credential";

import { COACH_PROFILE_CONSTANTS, SPECIALTY_PRESET } from "./coach-profile.constants";

export const coachProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  specialties: z.string().array(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const specialtiesUpdateSchema = z
  .array(z.string().refine((value) => (SPECIALTY_PRESET as readonly string[]).includes(value)))
  .max(COACH_PROFILE_CONSTANTS.MAX_SPECIALTIES)
  .refine((values) => new Set(values).size === values.length, "Specialties must be unique");

export const updateCoachProfileSchema = z.object({
  bio: z.string().max(COACH_PROFILE_CONSTANTS.MAX_BIO_LENGTH).nullable().optional(),
  location: z.string().max(COACH_PROFILE_CONSTANTS.MAX_LOCATION_LENGTH).nullable().optional(),
  specialties: specialtiesUpdateSchema.optional(),
});

export const coachProfileUserSchema = z.object({
  name: z.string().nullable(),
  email: z.string().email(),
  image: imageUrlSchema,
  role: userRoleSchema,
  timezone: timezoneSchema,
  createdAt: z.date(),
});

export const trackRecordSchema = z.object({
  monthsActive: z.number().int().nonnegative(),
  athletesCoached: z.number().int().nonnegative(),
  plansAuthored: z.number().int().nonnegative(),
});

export const coachProfilePageDataSchema = z.object({
  user: coachProfileUserSchema,
  profile: z.object({
    bio: z.string().nullable(),
    location: z.string().nullable(),
    specialties: z.string().array(),
  }),
  credentials: z.array(coachCredentialSchema),
  trackRecord: trackRecordSchema,
});

export const selfUpdateCoachProfileSchema = z.object({
  name: z.string().min(1).max(COACH_PROFILE_CONSTANTS.MAX_NAME_LENGTH).nullable().optional(),
  image: imageUrlSchema.optional(),
  timezone: timezoneSchema.optional(),
  bio: z.string().max(COACH_PROFILE_CONSTANTS.MAX_BIO_LENGTH).nullable().optional(),
  location: z.string().max(COACH_PROFILE_CONSTANTS.MAX_LOCATION_LENGTH).nullable().optional(),
  specialties: specialtiesUpdateSchema.optional(),
});
