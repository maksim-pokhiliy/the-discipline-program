import { type PrismaClient } from "@prisma/client";

import { schemaWhere } from "./shared";
import { type CoverageCell } from "./types";

const ROW_GROUP_FLOOR = 5;

const countRowGroup = async (db: PrismaClient, planId: string): Promise<number> =>
  db.rowGroup.count({ where: { schema: schemaWhere(planId) } });

const countRowGroupMembers = async (db: PrismaClient, planId: string): Promise<number> =>
  db.schemaRow.count({
    where: { rowGroupId: { not: null }, schema: schemaWhere(planId) },
  });

const ROW_GROUP_PRESENT_CELL: CoverageCell = {
  id: "rowGroup.present",
  category: "rowGroup",
  label: "RowGroup present (schema owns a contiguous row box)",
  required: ROW_GROUP_FLOOR,
  sourceRef: "session-primitive DR-W4-RG-CREATE row-group presence",
  tally: countRowGroup,
};

const ROW_GROUP_MEMBER_CELL: CoverageCell = {
  id: "rowGroup.member",
  category: "rowGroup",
  label: "SchemaRow that is a row-group member (rowGroupId set)",
  required: ROW_GROUP_FLOOR,
  sourceRef: "session-primitive DR-W4-RG-CREATE row-group membership",
  tally: countRowGroupMembers,
};

export const STRUCTURAL_CELLS: readonly CoverageCell[] = [
  ROW_GROUP_PRESENT_CELL,
  ROW_GROUP_MEMBER_CELL,
];
