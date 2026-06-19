import { type Prisma } from "@prisma/client";

const nameSelect = { select: { name: true } } as const;

const planSelect = {
  select: { name: true, weeks: { orderBy: { startDate: "asc" }, select: { id: true } } },
} as const;

const sessionDetailRowInclude = {
  modifierAssignments: { orderBy: { order: "asc" }, include: { modifier: true } },
  exercise: true,
} satisfies Prisma.SchemaRowInclude;

export const sessionDetailInclude = {
  day: {
    include: {
      week: { include: { plan: planSelect } },
      label: nameSelect,
    },
  },
  blocks: {
    orderBy: { order: "asc" },
    include: {
      labelAssignments: { orderBy: { order: "asc" }, include: { label: true } },
      schemas: {
        orderBy: { order: "asc" },
        include: {
          rows: { orderBy: { order: "asc" }, include: sessionDetailRowInclude },
          rowGroups: true,
        },
      },
      groups: true,
    },
  },
  label: nameSelect,
} satisfies Prisma.SessionInclude;

export type SessionDetailRecord = Prisma.SessionGetPayload<{
  include: typeof sessionDetailInclude;
}>;
export type SessionDetailBlock = SessionDetailRecord["blocks"][number];
export type SessionDetailSchema = SessionDetailBlock["schemas"][number];
export type SessionDetailRow = SessionDetailSchema["rows"][number];

export type PerformedSessionRecord = Prisma.PerformedSessionGetPayload<object>;

export type BenchmarkResultRecord = Prisma.BenchmarkResultGetPayload<{
  select: { plannedSchemaId: true; result: true; recordedAt: true };
}>;
