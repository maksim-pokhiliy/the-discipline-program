import { isIP } from "node:net";

const sanitize = (raw: string | undefined | null): string | null => {
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

const rightmostForwardedFor = (forwarded: string | null): string | null => {
  if (!forwarded) {
    return null;
  }

  const hops = forwarded.split(",");

  for (let i = hops.length - 1; i >= 0; i -= 1) {
    const candidate = sanitize(hops[i]);

    if (candidate) {
      return candidate;
    }
  }

  return null;
};

export const getClientIp = (request: Request): string => {
  if (isOnVercel()) {
    const vercelClient = sanitize(request.headers.get("x-vercel-forwarded-for"));

    if (vercelClient) {
      return vercelClient;
    }

    const realIp = sanitize(request.headers.get("x-real-ip"));

    if (realIp) {
      return realIp;
    }
  }

  const rightmost = rightmostForwardedFor(request.headers.get("x-forwarded-for"));

  if (rightmost) {
    return rightmost;
  }

  return "unknown";
};
