export const bootstrapBackendDI = async (): Promise<void> => {
  const { setMonitoring, setRateLimiter, defaultRateLimiter, setIdempotencyStore } = await import(
    "@repo/api-routes"
  );
  const { defaultMonitoring } = await import("../infrastructure/monitoring");
  const { prismaIdempotencyStore } = await import("../idempotency");

  setMonitoring(defaultMonitoring);
  setRateLimiter(defaultRateLimiter);
  setIdempotencyStore(prismaIdempotencyStore);
};
