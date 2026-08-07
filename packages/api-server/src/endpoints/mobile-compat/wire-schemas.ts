import { z } from "zod";

const FIRST_PRINTABLE_CODE_POINT = 0x20;
const DELETE_CODE_POINT = 0x7f;

const isControlCharacter = (character: string): boolean => {
  const codePoint = character.codePointAt(0) ?? FIRST_PRINTABLE_CODE_POINT;

  return codePoint < FIRST_PRINTABLE_CODE_POINT || codePoint === DELETE_CODE_POINT;
};

const hasNoControlCharacters = (value: string): boolean => ![...value].some(isControlCharacter);

const usernameSchema = z.string().refine(hasNoControlCharacters);

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
