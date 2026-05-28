import { type PrismaClient } from "@prisma/client";

export type CoverageCategory =
  | "catalog"
  | "entity-invariants"
  | "archetype"
  | "rowKind"
  | "exerciseForm"
  | "load.kind"
  | "weight.variant"
  | "percentageReference.scope"
  | "repNotation.kind"
  | "perLimb.kind"
  | "tempoModifier.axis"
  | "sequenceIndicator.kind"
  | "intensity.dim"
  | "restSpec.scope"
  | "restSpec.unit"
  | "restSpec.qualifier"
  | "timeCap"
  | "schemaKind"
  | "connectorForm"
  | "position"
  | "stagedProgram.kind"
  | "slotSpec.kind"
  | "mediaReference"
  | "perSetSubstitution"
  | "compoundForm"
  | "compoundRepDefinition.form"
  | "footnote";

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
