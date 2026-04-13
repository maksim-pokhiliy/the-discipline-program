import { type Prisma, PrismaClient } from "@prisma/client";

import { baseEnv } from "@repo/env/base";
import { NotFoundError } from "@repo/errors";
import { logger } from "@repo/shared";

const SOFT_DELETE_MODELS = new Set([
  "User",
  "Product",
  "TrainingPlan",
  "Workout",
  "CoachProfile",
  "MarketingBlogPost",
  "MarketingReview",
  "MarketingContactSubmission",
]);

const SOFT_DELETE_UNIQUE_FIELDS: Record<string, string[]> = {
  Product: ["slug"],
  MarketingBlogPost: ["slug"],
};

type ModelDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
  findUnique: (args: {
    where: Record<string, unknown>;
    select?: Record<string, boolean>;
  }) => Promise<Record<string, unknown> | null>;
  findFirst: (args: Record<string, unknown>) => Promise<unknown>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
  updateMany: (args: Record<string, unknown>) => Promise<unknown>;
};

const isModelDelegate = (val: unknown): val is ModelDelegate =>
  val !== null && typeof val === "object" && "findFirst" in val;

const getDelegate = (client: PrismaClient, model: string): ModelDelegate | undefined => {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  const candidate: unknown = Reflect.get(client, key);

  return isModelDelegate(candidate) ? candidate : undefined;
};

const withDeletedAtFilter = (where: unknown): Record<string, unknown> => {
  const record = Object.fromEntries(
    Object.entries((typeof where === "object" && where !== null ? where : {}) satisfies object),
  );

  if (record.deletedAt === undefined) {
    record.deletedAt = null;
  }

  return record;
};

const QUERY_TIMEOUT_MS = 30_000;
const CONNECT_TIMEOUT_S = 10;

const withTimeoutParams = (url: string): string => {
  const separator = url.includes("?") ? "&" : "?";
  const params: string[] = [];

  if (!url.includes("statement_timeout")) {
    params.push(`statement_timeout=${QUERY_TIMEOUT_MS}`);
  }

  if (!url.includes("connect_timeout")) {
    params.push(`connect_timeout=${CONNECT_TIMEOUT_S}`);
  }

  return params.length > 0 ? `${url}${separator}${params.join("&")}` : url;
};

const isDev = baseEnv.NODE_ENV === "development";

type QueryEventHandler = (event: "query", listener: (e: Prisma.QueryEvent) => void) => void;

const createClient = () => {
  const client = new PrismaClient({
    log: isDev
      ? [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ]
      : [{ emit: "stdout", level: "error" }],
    datasourceUrl: withTimeoutParams(baseEnv.DATABASE_URL),
  });

  if (isDev) {
    (client.$on as QueryEventHandler)("query", (e) => {
      logger.info("Prisma query", { query: e.query, duration: `${e.duration}ms` });
    });
  }

  return client.$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = withDeletedAtFilter(args.where);
          }

          return query(args);
        },

        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = withDeletedAtFilter(args.where);
          }

          return query(args);
        },

        async findFirstOrThrow({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = withDeletedAtFilter(args.where);
          }

          return query(args);
        },

        async count({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = withDeletedAtFilter(args.where);
          }

          return query(args);
        },

        async aggregate({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = withDeletedAtFilter(args.where);
          }

          return query(args);
        },

        async groupBy({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = withDeletedAtFilter(args.where);
          }

          return query(args);
        },

        async findUnique({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.has(model)) {
            return query(args);
          }

          const delegate = getDelegate(client, model);

          if (!delegate) {
            return query(args);
          }

          return delegate.findFirst({
            ...args,
            where: { ...args.where, deletedAt: null },
          });
        },

        async findUniqueOrThrow({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.has(model)) {
            return query(args);
          }

          const delegate = getDelegate(client, model);

          if (!delegate) {
            return query(args);
          }

          const result = await delegate.findFirst({
            ...args,
            where: { ...args.where, deletedAt: null },
          });

          if (!result) {
            throw new NotFoundError(`${model} not found`);
          }

          return result;
        },

        async delete({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.has(model)) {
            return query(args);
          }

          const delegate = getDelegate(client, model);

          if (!delegate) {
            return query(args);
          }

          const uniqueFields = SOFT_DELETE_UNIQUE_FIELDS[model];
          const data: Record<string, unknown> = { deletedAt: new Date() };

          if (uniqueFields) {
            const select = Object.fromEntries(uniqueFields.map((f) => [f, true]));
            const current = await delegate.findUnique({
              where: Object.fromEntries(Object.entries(args.where ?? {})),
              select,
            });

            if (current) {
              const suffix = `_deleted_${Date.now()}`;

              for (const field of uniqueFields) {
                data[field] = `${current[field]}${suffix}`;
              }
            }
          }

          return delegate.update({ ...args, data });
        },

        async deleteMany({ model, args, query }) {
          if (!SOFT_DELETE_MODELS.has(model)) {
            return query(args);
          }

          const delegate = getDelegate(client, model);

          if (!delegate) {
            return query(args);
          }

          const uniqueFields = SOFT_DELETE_UNIQUE_FIELDS[model];

          if (uniqueFields) {
            const select = Object.fromEntries([
              ["id", true],
              ...uniqueFields.map((f) => [f, true]),
            ]);
            const records = await delegate.findMany({ where: args.where, select });
            const suffix = `_deleted_${Date.now()}`;

            for (const record of records) {
              const data: Record<string, unknown> = { deletedAt: new Date() };

              for (const field of uniqueFields) {
                data[field] = `${record[field]}${suffix}`;
              }

              await delegate.update({
                where: { id: record.id },
                data,
              });
            }

            return { count: records.length };
          }

          return delegate.updateMany({ ...args, data: { deletedAt: new Date() } });
        },
      },
    },
  });
};

declare global {
  var prisma: ReturnType<typeof createClient> | undefined;
}

export const prisma = globalThis.prisma ?? createClient();

if (baseEnv.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export type ExtendedPrismaClient = typeof prisma;
