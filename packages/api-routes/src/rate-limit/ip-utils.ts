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

const leftmostForwardedFor = (forwarded: string | null): string | null => {
  if (!forwarded) {
    return null;
  }

  const hops = forwarded.split(",");

  for (const hop of hops) {
    const candidate = sanitize(hop);

    if (candidate) {
      return candidate;
    }
  }

  return null;
};

export const getClientIp = (request: Request): string => {
  const vercelClient = sanitize(request.headers.get("x-vercel-forwarded-for"));

  if (vercelClient) {
    return vercelClient;
  }

  if (isOnVercel()) {
    const realIp = sanitize(request.headers.get("x-real-ip"));

    if (realIp) {
      return realIp;
    }
  }

  const leftmost = leftmostForwardedFor(request.headers.get("x-forwarded-for"));

  if (leftmost) {
    return leftmost;
  }

  return "unknown";
};
