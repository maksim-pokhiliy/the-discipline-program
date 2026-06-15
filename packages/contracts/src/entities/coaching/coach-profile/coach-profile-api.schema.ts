import {
  coachProfilePageDataSchema,
  coachProfileSchema,
  selfUpdateCoachProfileSchema,
} from "./coach-profile.schema";

export const getCoachProfileResponseSchema = coachProfileSchema;

export const getCoachProfilePageDataResponseSchema = coachProfilePageDataSchema;

export const updateCoachProfileRequestSchema = selfUpdateCoachProfileSchema;

export const updateCoachProfileResponseSchema = coachProfileSchema;
