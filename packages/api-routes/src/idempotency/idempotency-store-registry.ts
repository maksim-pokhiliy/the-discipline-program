import { logger } from "@repo/shared";

import { getDiRegistrySlot } from "../di-global";

import type { IdempotencyStorePort } from "./port";

let hasWarnedMissing = false;

export const setIdempotencyStore = (port: IdempotencyStorePort): void => {
  getDiRegistrySlot().idempotencyStore = port;
};

export const getIdempotencyStore = (): IdempotencyStorePort | undefined => {
  const store = getDiRegistrySlot().idempotencyStore;

  if (!store && !hasWarnedMissing && process.env.NODE_ENV === "production") {
    hasWarnedMissing = true;
    logger.error("idempotency.unavailable", { reason: "registry_not_bootstrapped" });
  }

  return store;
};
