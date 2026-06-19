import { type Prisma } from "@prisma/client";

export const oneRMRecordExerciseInclude = {
  exercise: { select: { canonicalName: true } },
} satisfies Prisma.OneRMRecordInclude;

export const benchmarkRecordSchemaInclude = {
  plannedSchema: {
    select: {
      header: true,
      composition: true,
      block: {
        select: {
          session: {
            select: {
              label: { select: { name: true } },
              day: { select: { label: { select: { name: true } } } },
            },
          },
        },
      },
      rows: {
        orderBy: { order: "asc" },
        select: {
          load: true,
          reps: true,
          exercise: { select: { canonicalName: true } },
        },
      },
    },
  },
} satisfies Prisma.BenchmarkResultInclude;

export type OneRMRecordRecord = Prisma.OneRMRecordGetPayload<{
  include: typeof oneRMRecordExerciseInclude;
}>;

export type RecordsBenchmarkResultRecord = Prisma.BenchmarkResultGetPayload<{
  include: typeof benchmarkRecordSchemaInclude;
}>;
