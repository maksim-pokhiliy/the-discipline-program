import { z } from "zod";

export const legacySigninRequestSchema = z.object({
  username: z.string(),
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
