import { isIP } from "node:net";

const TRUSTED_PROXY_HOPS_RADIX = 10;
const UNKNOWN_CLIENT_IP = "unknown";

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

const isOnVercel = (): boolean => Boolean(process.env.VERCEL_ENV);

const trustedProxyHops = (): number => {
  const raw = process.env.RATE_LIMIT_TRUSTED_PROXY_HOPS;

  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw.trim(), TRUSTED_PROXY_HOPS_RADIX);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};

const forwardedForHopFromRight = (
  forwarded: string | null,
  hopsFromRight: number,
): string | null => {
  if (!forwarded || hopsFromRight <= 0) {
    return null;
  }

  const hops = forwarded.split(",");
  const index = hops.length - hopsFromRight;

  if (index < 0) {
    return null;
  }

  return sanitize(hops[index]);
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

    return UNKNOWN_CLIENT_IP;
  }

  const trustedHop = forwardedForHopFromRight(
    request.headers.get("x-forwarded-for"),
    trustedProxyHops(),
  );

  if (trustedHop) {
    return trustedHop;
  }

  return UNKNOWN_CLIENT_IP;
};
