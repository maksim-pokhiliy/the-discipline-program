import { isIP } from "node:net";

const sanitize = (raw: string | undefined): string | null => {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  return isIP(trimmed) ? trimmed : null;
};

const isOnVercel = (): boolean => Boolean(process.env.VERCEL);

export const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = sanitize(forwarded.split(",")[0]);

    if (first) {
      return first;
    }
  }

  if (isOnVercel()) {
    const realIp = sanitize(request.headers.get("x-real-ip") ?? undefined);

    if (realIp) {
      return realIp;
    }
  }

  return "unknown";
};
