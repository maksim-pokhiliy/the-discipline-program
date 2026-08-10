import { z } from "zod";

import { AUTH_CONSTANTS } from "@repo/contracts/iam/auth";

const FIRST_PRINTABLE_CODE_POINT = 0x20;
const DELETE_CODE_POINT = 0x7f;
const MAX_USERNAME_LENGTH = 100;
const MAX_PROFILE_FIELD_LENGTH = 255;
const LONE_SURROGATE = /\p{Surrogate}/u;

const isControlCharacter = (character: string): boolean => {
  const codePoint = character.codePointAt(0) ?? FIRST_PRINTABLE_CODE_POINT;

  return codePoint < FIRST_PRINTABLE_CODE_POINT || codePoint === DELETE_CODE_POINT;
};

const isPostgresStorable = (value: string): boolean =>
  !LONE_SURROGATE.test(value) && ![...value].some(isControlCharacter);

const usernameSchema = z.string().max(MAX_USERNAME_LENGTH).refine(isPostgresStorable);

export const legacySigninRequestSchema = z.object({
  username: usernameSchema,
  password: z.string(),
});

export type LegacySigninRequest = z.infer<typeof legacySigninRequestSchema>;

export type LegacyCatalogRefDto = { id: number; name: string };

export type LegacyJwtDto = {
  userId: number;
  accessToken: string;
  userRole: LegacyCatalogRefDto;
  userPlan: LegacyCatalogRefDto;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_LENGTH = 10;

export const isValidIsoDate = (value: string): boolean => {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, ISO_DATE_LENGTH) === value
  );
};

export const serializeLegacyDate = (value: Date | null): string | null =>
  value ? value.toISOString().slice(0, ISO_DATE_LENGTH) : null;

export const parseLegacyDate = (value: string | null): Date | null =>
  value ? new Date(`${value}T00:00:00.000Z`) : null;

export const userIdParamSchema = z.object({ id: z.coerce.number().int() });

export const updateUserRequestSchema = z.object({
  id: z.number().int(),
  firstName: z
    .string()
    .max(MAX_PROFILE_FIELD_LENGTH)
    .refine(isPostgresStorable)
    .nullish()
    .transform((value) => value ?? null),
  lastName: z
    .string()
    .max(MAX_PROFILE_FIELD_LENGTH)
    .refine(isPostgresStorable)
    .nullish()
    .transform((value) => value ?? null),
  phoneNumber: z
    .string()
    .max(MAX_PROFILE_FIELD_LENGTH)
    .refine(isPostgresStorable)
    .nullish()
    .transform((value) => value ?? null),
  dateOfBirth: z
    .string()
    .refine(isValidIsoDate)
    .nullish()
    .transform((value) => value ?? null),
});

export const changePasswordRequestSchema = z.object({
  userId: z.number().int(),
  oldPassword: z.string(),
  newPassword: z.string(),
});

export const newPasswordPolicySchema = z
  .string()
  .min(AUTH_CONSTANTS.MIN_PASSWORD_LENGTH)
  .max(AUTH_CONSTANTS.MAX_PASSWORD_LENGTH);

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export type LegacyUserDto = {
  id: number;
  isEnabled: boolean;
  username: string;
  userRole: LegacyCatalogRefDto;
  userPlan: LegacyCatalogRefDto;
  trainingLevel: LegacyCatalogRefDto;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  team: null;
};
