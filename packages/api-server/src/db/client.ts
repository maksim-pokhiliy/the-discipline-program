import { PrismaClient } from "@prisma/client";

import { env } from "@repo/env";

const createClient = () => {
  const client = new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (
            model === "User" ||
            model === "TrainingPlan" ||
            model === "Workout" ||
            model === "Exercise" ||
            model === "MarketingBlogPost" ||
            model === "MarketingReview"
          ) {
            if (!args.where) {
              args.where = {};
            }

            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null;
            }
          }

          return query(args);
        },

        async findFirst({ model, args, query }) {
          if (
            model === "User" ||
            model === "TrainingPlan" ||
            model === "Workout" ||
            model === "Exercise" ||
            model === "MarketingBlogPost" ||
            model === "MarketingReview"
          ) {
            if (!args.where) {
              args.where = {};
            }

            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null;
            }
          }

          return query(args);
        },

        async findUnique({ model, args, query }) {
          switch (model) {
            case "User":
              return client.user.findFirst({
                ...args,
                where: { ...args.where, deletedAt: null },
              });
            case "TrainingPlan":
              return client.trainingPlan.findFirst({
                ...args,
                where: { ...args.where, deletedAt: null },
              });
            case "Workout":
              return client.workout.findFirst({
                ...args,
                where: { ...args.where, deletedAt: null },
              });
            case "Exercise":
              return client.exercise.findFirst({
                ...args,
                where: { ...args.where, deletedAt: null },
              });
            case "MarketingBlogPost":
              return client.marketingBlogPost.findFirst({
                ...args,
                where: { ...args.where, deletedAt: null },
              });
            case "MarketingReview":
              return client.marketingReview.findFirst({
                ...args,
                where: { ...args.where, deletedAt: null },
              });
            default:
              return query(args);
          }
        },

        async delete({ model, args, query }) {
          switch (model) {
            case "User":
              return client.user.update({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "TrainingPlan":
              return client.trainingPlan.update({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "Workout":
              return client.workout.update({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "Exercise":
              return client.exercise.update({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "MarketingBlogPost":
              return client.marketingBlogPost.update({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "MarketingReview":
              return client.marketingReview.update({
                ...args,
                data: { deletedAt: new Date() },
              });
            default:
              return query(args);
          }
        },

        async deleteMany({ model, args, query }) {
          switch (model) {
            case "User":
              return client.user.updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "TrainingPlan":
              return client.trainingPlan.updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "Workout":
              return client.workout.updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "Exercise":
              return client.exercise.updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "MarketingBlogPost":
              return client.marketingBlogPost.updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            case "MarketingReview":
              return client.marketingReview.updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            default:
              return query(args);
          }
        },
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type ExtendedPrismaClient = typeof prisma;
