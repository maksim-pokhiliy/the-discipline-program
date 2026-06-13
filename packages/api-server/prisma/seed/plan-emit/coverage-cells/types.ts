import { type PrismaClient } from "@prisma/client";

export type CoverageCategory =
  | "catalog"
  | "entity-invariants"
  | "load.kind"
  | "percentageReference.scope"
  | "repNotation.kind"
  | "perLimb.kind"
  | "tempoModifier.axis"
  | "intensity.dim"
  | "restSpec.scope"
  | "restSpec.unit"
  | "restSpec.qualifier"
  | "timeCap"
  | "mediaReference"
  | "modifier"
  | "rowGroup"
  | "composition"
  | "repetition.kind"
  | "rest";

export type CoverageCell = {
  id: string;
  category: CoverageCategory;
  label: string;
  required: number;
  sourceRef: string;
  tally: (db: PrismaClient, planId: string) => Promise<number>;
};

export type CoverageCellResult = {
  cell: CoverageCell;
  count: number;
  satisfied: boolean;
};

export type CoverageReport = {
  cells: readonly CoverageCellResult[];
  missing: readonly CoverageCell[];
  satisfied: number;
  total: number;
};
