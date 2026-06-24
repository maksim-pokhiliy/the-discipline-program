import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDiRegistrySlot, resetDiRegistrySlotForTests } from "../di-global";
import type { IdempotencyStorePort } from "../idempotency/port";
import type { MonitoringPort } from "../monitoring";
import type { RateLimiterPort } from "../rate-limit/rate-limiter-port";

const DI_REGISTRY_KEY = Symbol.for("@repo/api-routes/di-registry");

const buildMonitoringPort = (label: string): MonitoringPort => ({
  captureException: () => label,
  captureMessage: () => label,
  setUser: () => undefined,
  setContext: () => undefined,
  flush: async () => true,
});

const buildRateLimiterPort = (): RateLimiterPort => ({
  check: async () => ({
    allowed: true,
    limit: 10,
    remaining: 9,
    resetAt: Date.now() + 60_000,
  }),
});

const buildIdempotencyStorePort = (): IdempotencyStorePort => ({
  lookup: async () => ({ kind: "miss" }),
  persist: async () => ({ status: "persisted" }),
});

describe("di-global", () => {
  beforeEach(() => {
    resetDiRegistrySlotForTests();
  });

  afterEach(() => {
    resetDiRegistrySlotForTests();
    vi.restoreAllMocks();
  });

  describe("cross-instance sharing across a module-instance boundary", () => {
    it("makes a monitoring port set in one module instance visible from a fresh re-import", async () => {
      const port = buildMonitoringPort("monitoring");

      const { setMonitoring } = await import("../monitoring");

      setMonitoring(port);

      vi.resetModules();

      const { getMonitoring } = await import("../monitoring");

      expect(getMonitoring()).toBe(port);
    });

    it("makes a rate-limiter port set in one module instance visible from a fresh re-import", async () => {
      const port = buildRateLimiterPort();

      const { setRateLimiter } = await import("../rate-limit/rate-limiter-registry");

      setRateLimiter(port);

      vi.resetModules();

      const { getRateLimiter } = await import("../rate-limit/rate-limiter-registry");

      expect(getRateLimiter()).toBe(port);
    });

    it("makes an idempotency store set in one module instance visible from a fresh re-import", async () => {
      const port = buildIdempotencyStorePort();

      const { setIdempotencyStore } = await import("../idempotency/idempotency-store-registry");

      setIdempotencyStore(port);

      vi.resetModules();

      const { getIdempotencyStore } = await import("../idempotency/idempotency-store-registry");

      expect(getIdempotencyStore()).toBe(port);
    });
  });

  describe("slot identity", () => {
    it("returns the same slot object reference across calls", () => {
      expect(getDiRegistrySlot()).toBe(getDiRegistrySlot());
    });

    it("stores the slot at globalThis under the shared Symbol.for key", () => {
      const slot = getDiRegistrySlot();

      expect((globalThis as Record<symbol, unknown>)[DI_REGISTRY_KEY]).toBe(slot);
    });
  });

  describe("resetDiRegistrySlotForTests", () => {
    it("clears the slot so re-imported getters return undefined", async () => {
      const { setMonitoring, getMonitoring } = await import("../monitoring");

      setMonitoring(buildMonitoringPort("monitoring"));

      expect(getMonitoring()).toBeDefined();

      resetDiRegistrySlotForTests();

      vi.resetModules();

      const { getMonitoring: getMonitoringAgain } = await import("../monitoring");

      expect(getMonitoringAgain()).toBeUndefined();
    });

    it("removes the underlying globalThis property", () => {
      getDiRegistrySlot();

      resetDiRegistrySlotForTests();

      expect((globalThis as Record<symbol, unknown>)[DI_REGISTRY_KEY]).toBeUndefined();
    });
  });
});
