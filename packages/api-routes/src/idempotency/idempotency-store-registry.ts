import { logger } from "@repo/shared";

import type { IdempotencyStorePort } from "./port";

let store: IdempotencyStorePort | undefined;
let hasWarnedMissing = false;

export const setIdempotencyStore = (port: IdempotencyStorePort): void => {
  store = port;
};

export const getIdempotencyStore = (): IdempotencyStorePort | undefined => {
  if (!store && !hasWarnedMissing && process.env.NODE_ENV === "production") {
    hasWarnedMissing = true;
    logger.warn("idempotency.unavailable", { reason: "registry_not_bootstrapped" });
  }

  return store;
};
