import { type Prisma } from "@prisma/client";

export const SCHEMA_BODY_INCLUDE = {
  rows: {
    orderBy: { order: "asc" },
    include: {
      modifierAssignments: {
        orderBy: { order: "asc" },
        include: { modifier: true },
      },
    },
  },
  rowGroups: true,
} satisfies Prisma.SchemaInclude;
