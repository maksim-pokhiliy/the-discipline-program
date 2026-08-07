import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

import { mobileShimEnv } from "@repo/env/mobile-shim";

const ALGORITHM = "HS256";
const EXPIRATION = "30d";

const claimsSchema = z.object({
  sub: z.string().min(1),
  legacyUserId: z.number().int(),
  tokenVersion: z.number().int(),
});

export type MobileShimClaims = z.infer<typeof claimsSchema>;

let cachedKey: Uint8Array | null = null;

const getSigningKey = (): Uint8Array => {
  if (cachedKey === null) {
    cachedKey = new TextEncoder().encode(mobileShimEnv.MOBILE_SHIM_JWT_SECRET);
  }

  return cachedKey;
};

export const signMobileShimToken = async (claims: MobileShimClaims): Promise<string> =>
  new SignJWT({ legacyUserId: claims.legacyUserId, tokenVersion: claims.tokenVersion })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSigningKey());

export const verifyMobileShimToken = async (token: string): Promise<MobileShimClaims | null> => {
  const key = getSigningKey();

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: [ALGORITHM] });
    const parsed = claimsSchema.safeParse(payload);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};
