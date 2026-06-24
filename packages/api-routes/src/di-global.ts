import type { IdempotencyStorePort } from "./idempotency/port";
import type { MonitoringPort } from "./monitoring";
import type { RateLimiterPort } from "./rate-limit/rate-limiter-port";

export type DiRegistrySlot = {
  monitoring?: MonitoringPort;
  rateLimiter?: RateLimiterPort;
  idempotencyStore?: IdempotencyStorePort;
};

const DI_REGISTRY_KEY = Symbol.for("@repo/api-routes/di-registry");

const globalForDi = globalThis as typeof globalThis & {
  [DI_REGISTRY_KEY]?: DiRegistrySlot;
};

export const getDiRegistrySlot = (): DiRegistrySlot => {
  globalForDi[DI_REGISTRY_KEY] ??= {};

  return globalForDi[DI_REGISTRY_KEY];
};

export const resetDiRegistrySlotForTests = (): void => {
  delete globalForDi[DI_REGISTRY_KEY];
};
