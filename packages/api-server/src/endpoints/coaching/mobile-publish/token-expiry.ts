const JWT_SEGMENT_COUNT = 3;
const PAYLOAD_SEGMENT_INDEX = 1;
const MS_PER_SECOND = 1000;
const FALLBACK_TTL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * MS_PER_SECOND;

const fallbackExpiry = (now: Date): Date =>
  new Date(now.getTime() + FALLBACK_TTL_DAYS * MS_PER_DAY);

const readExpClaim = (token: string): number | null => {
  const segments = token.split(".");

  if (segments.length !== JWT_SEGMENT_COUNT) {
    return null;
  }

  const payloadSegment = segments[PAYLOAD_SEGMENT_INDEX];

  if (payloadSegment === undefined || payloadSegment.length === 0) {
    return null;
  }

  try {
    const decoded: unknown = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "exp" in decoded &&
      typeof decoded.exp === "number"
    ) {
      return decoded.exp;
    }

    return null;
  } catch {
    return null;
  }
};

export const deriveTokenExpiry = (token: string, now: Date): Date => {
  const exp = readExpClaim(token);

  if (exp === null) {
    return fallbackExpiry(now);
  }

  return new Date(exp * MS_PER_SECOND);
};
