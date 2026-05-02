import { Prisma } from "@prisma/client";

import type {
  CachedResponse,
  IdempotencyLookupResult,
  IdempotencyPersistResult,
  IdempotencyStorePort,
} from "@repo/api-routes";
import { logger } from "@repo/shared";

import { prisma, type ExtendedPrismaClient } from "../db/client";

const isP2002 = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

const toReplayHeaders = (raw: Prisma.JsonValue): Record<string, string> => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const entries = Object.entries(raw as Record<string, unknown>).flatMap(
    ([k, v]): Array<[string, string]> => (typeof v === "string" ? [[k, v]] : []),
  );

  return Object.fromEntries(entries);
};

const recordToCachedResponse = (record: {
  responseStatus: number;
  responseBody: Prisma.JsonValue;
  responseHeaders: Prisma.JsonValue;
  createdAt: Date;
}): CachedResponse => ({
  status: record.responseStatus,
  body: record.responseBody,
  headers: toReplayHeaders(record.responseHeaders),
  createdAt: record.createdAt,
});

const lookup =
  (client: ExtendedPrismaClient) =>
  async (args: {
    key: string;
    scope: string;
    route: string;
    requestFingerprint: string;
  }): Promise<IdempotencyLookupResult> => {
    const { key, scope, route, requestFingerprint } = args;
    const record = await client.requestIdempotency.findUnique({
      where: { key_scope_route: { key, scope, route } },
    });

    if (!record) {
      return { kind: "miss" };
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      client.requestIdempotency.delete({ where: { id: record.id } }).catch(() => undefined);

      return { kind: "miss" };
    }

    if (record.requestFingerprint !== requestFingerprint) {
      return { kind: "mismatch" };
    }

    return { kind: "replay", cached: recordToCachedResponse(record) };
  };

const persist =
  (client: ExtendedPrismaClient) =>
  async (args: {
    key: string;
    scope: string;
    route: string;
    method: string;
    requestFingerprint: string;
    response: CachedResponse;
    ttlSeconds: number;
  }): Promise<IdempotencyPersistResult> => {
    const { key, scope, route, method, requestFingerprint, response, ttlSeconds } = args;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      await client.requestIdempotency.create({
        data: {
          key,
          scope,
          route,
          method,
          requestFingerprint,
          responseStatus: response.status,
          responseBody: response.body as Prisma.InputJsonValue,
          responseHeaders: response.headers as unknown as Prisma.InputJsonValue,
          expiresAt,
        },
      });

      return { status: "persisted" };
    } catch (error) {
      if (!isP2002(error)) {
        throw error;
      }

      const raced = await client.requestIdempotency.findUnique({
        where: { key_scope_route: { key, scope, route } },
      });

      if (
        !raced ||
        raced.requestFingerprint !== requestFingerprint ||
        raced.expiresAt.getTime() <= Date.now()
      ) {
        logger.warn("idempotency.persist_race_unrecoverable", { route });

        return { status: "persisted" };
      }

      return { status: "raced", cached: recordToCachedResponse(raced) };
    }
  };

export const createPrismaIdempotencyStore = (
  client: ExtendedPrismaClient = prisma,
): IdempotencyStorePort => ({
  lookup: lookup(client),
  persist: persist(client),
});

export const prismaIdempotencyStore: IdempotencyStorePort = createPrismaIdempotencyStore();
