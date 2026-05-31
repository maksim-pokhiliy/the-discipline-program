import { logger } from "@repo/shared";

export const bootstrapBackendDI = async (): Promise<void> => {
  const {
    setMonitoring,
    getMonitoring,
    setRateLimiter,
    getRateLimiter,
    defaultRateLimiter,
    setIdempotencyStore,
    getIdempotencyStore,
  } = await import("@repo/api-routes");
  const { defaultMonitoring } = await import("../infrastructure/monitoring");
  const { prismaIdempotencyStore } = await import("../idempotency");

  setMonitoring(defaultMonitoring);
  setRateLimiter(defaultRateLimiter);
  setIdempotencyStore(prismaIdempotencyStore);

  const missing = [
    !getMonitoring() && "monitoring",
    !getRateLimiter() && "rateLimiter",
    !getIdempotencyStore() && "idempotencyStore",
  ].filter((entry): entry is string => Boolean(entry));

  if (missing.length > 0) {
    logger.warn("di.bootstrap_incomplete", { missing });
  }
};
