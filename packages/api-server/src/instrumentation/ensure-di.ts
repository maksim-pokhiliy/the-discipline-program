import {
  defaultRateLimiter,
  setIdempotencyStore,
  setMonitoring,
  setRateLimiter,
} from "@repo/api-routes";

import { prismaIdempotencyStore } from "../idempotency";
import { defaultMonitoring } from "../infrastructure/monitoring";

export const ensureBackendDI = (): void => {
  setMonitoring(defaultMonitoring);
  setRateLimiter(defaultRateLimiter);
  setIdempotencyStore(prismaIdempotencyStore);
};

if (process.env.NODE_ENV !== "test") {
  ensureBackendDI();
}
