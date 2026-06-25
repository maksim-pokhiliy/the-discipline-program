import { type Prisma } from "@prisma/client";

import { SCHEMA_BODY_INCLUDE } from "../../lms/_shared";

const SCHEMA_BODY_WITH_EXERCISE_INCLUDE = {
  ...SCHEMA_BODY_INCLUDE,
  rows: {
    ...SCHEMA_BODY_INCLUDE.rows,
    include: {
      ...SCHEMA_BODY_INCLUDE.rows.include,
      exercise: true,
    },
  },
} satisfies Prisma.SchemaInclude;

export const MOBILE_PUBLISH_DAY_INCLUDE = {
  label: true,
  week: { select: { startDate: true } },
  sessions: {
    orderBy: { order: "asc" as const },
    include: {
      blocks: {
        orderBy: { order: "asc" as const },
        include: {
          labelAssignments: {
            orderBy: { order: "asc" as const },
            include: { label: true },
          },
          schemas: {
            orderBy: { order: "asc" as const },
            include: SCHEMA_BODY_WITH_EXERCISE_INCLUDE,
          },
          groups: true,
        },
      },
    },
  },
} satisfies Prisma.DayInclude;

export type MobilePublishDayPayload = Prisma.DayGetPayload<{
  include: typeof MOBILE_PUBLISH_DAY_INCLUDE;
}>;
