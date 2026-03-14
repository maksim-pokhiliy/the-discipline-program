import { PrismaClient } from "@prisma/client";

import { baseEnv } from "@repo/env/base";

const SOFT_DELETE_MODELS = new Set([
  "User",
  "Product",
  "Exercise",
  "TrainingPlan",
  "Workout",
  "CoachProfile",
  "MarketingBlogPost",
  "MarketingReview",
  "MarketingContactSubmission",
]);

const SOFT_DELETE_UNIQUE_FIELDS: Record<string, string[]> = {
  Exercise: ["name"],
  Product: ["slug"],
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

const getDelegate = (client: PrismaClient, model: string): ModelDelegate | undefined => {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  const delegate = (client as unknown as Record<string, unknown>)[key];

  if (delegate && typeof delegate === "object" && "findFirst" in delegate) {
    return delegate as unknown as ModelDelegate;
  }

  return undefined;
};

const createClient = () => {
  const client = new PrismaClient({
    log: baseEnv.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;

            if (where.deletedAt === undefined) {
              where.deletedAt = null;
            }

            args.where = where;
          }

          return query(args);
        },

        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;

            if (where.deletedAt === undefined) {
              where.deletedAt = null;
            }

            args.where = where;
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
              where: args.where as Record<string, unknown>,
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

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (baseEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type ExtendedPrismaClient = typeof prisma;
