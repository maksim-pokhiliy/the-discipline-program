export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export type RateLimiterPort = {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
};
