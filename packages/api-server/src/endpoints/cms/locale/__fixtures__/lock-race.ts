import { type Prisma } from "@prisma/client";
import { expect, vi } from "vitest";

import { AppError } from "@repo/errors";

import { cleanupRaw } from "../../../../test/helpers";

const OPEN_TRANSACTION_TIMEOUT_MS = 20_000;
const LOCK_WAIT_TIMEOUT_MS = 10_000;
const LOCK_WAIT_INTERVAL_MS = 25;

export type OpenTransaction = { commit: () => Promise<void> };

export const openTransaction = async (
  work: (tx: Prisma.TransactionClient) => Promise<unknown>,
): Promise<OpenTransaction> => {
  let release: () => void = () => undefined;
  let markWorked: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = () => resolve();
  });
  const worked = new Promise<void>((resolve) => {
    markWorked = () => resolve();
  });
  const transaction = cleanupRaw.$transaction(
    async (tx) => {
      await work(tx);
      markWorked();
      await released;
    },
    { timeout: OPEN_TRANSACTION_TIMEOUT_MS },
  );

  await Promise.race([worked, transaction]);

  return {
    commit: async () => {
      release();
      await transaction;
    },
  };
};

export const waitForLockWaiter = async (table: string): Promise<void> => {
  await vi.waitFor(
    async () => {
      const [activity] = await cleanupRaw.$queryRaw<{ waiting: number }[]>`
        select count(*)::int as waiting
        from pg_stat_activity
        where datname = current_database()
          and wait_event_type = 'Lock'
          and query like ${`%${table}%`}`;

      expect(activity?.waiting, `a statement on ${table} waiting for a lock`).toBeGreaterThan(0);
    },
    { timeout: LOCK_WAIT_TIMEOUT_MS, interval: LOCK_WAIT_INTERVAL_MS },
  );
};

export const refusalOf = (operation: Promise<unknown>): Promise<unknown> =>
  operation.then(
    () => undefined,
    (error: unknown) =>
      error instanceof AppError
        ? {
            name: error.name,
            statusCode: error.statusCode,
            message: error.message,
            details: error.details,
          }
        : error,
  );
