import { type Load, loadSchema, type ResultType } from "@repo/contracts/lms/_shared";
import {
  type Composition,
  compositionSchema,
  formatCompositionSummary,
  formatRepetitionLabel,
} from "@repo/contracts/lms/composition";

import { type RecordsBenchmarkResultRecord } from "./records-view.types";

const SUBLINE_PART_SEPARATOR = " · ";
const MOVEMENT_SEPARATOR = " / ";
const KG_SUFFIX = "kg";

const BENCHMARK_LABEL_BY_RESULT_TYPE: Record<ResultType, string> = {
  time: "Time",
  rounds_reps: "Rounds + Reps",
  load: "Load",
  max_reps: "Max Reps",
  distance: "Distance",
  calories: "Calories",
};

type BenchmarkPlannedSchema = RecordsBenchmarkResultRecord["plannedSchema"];
type BenchmarkSchemaRow = BenchmarkPlannedSchema["rows"][number];

const parseComposition = (
  composition: BenchmarkPlannedSchema["composition"],
): Composition | null => {
  if (composition === null) {
    return null;
  }

  const parsed = compositionSchema.safeParse(composition);

  return parsed.success ? parsed.data : null;
};

const movementLabel = (row: BenchmarkSchemaRow): string => {
  if (row.load === null) {
    return row.exercise.canonicalName;
  }

  const parsed = loadSchema.safeParse(row.load);
  const load: Load | null = parsed.success ? parsed.data : null;

  return load !== null && load.kind === "absolute"
    ? `${row.exercise.canonicalName} ${load.kg}${KG_SUFFIX}`
    : row.exercise.canonicalName;
};

const movementList = (rows: BenchmarkSchemaRow[]): string =>
  rows.map(movementLabel).join(MOVEMENT_SEPARATOR);

const faithfulSubline = (
  schema: BenchmarkPlannedSchema,
  composition: Composition,
): string | null => {
  const scheme = formatRepetitionLabel(composition);
  const movements = schema.rows.length > 0 ? movementList(schema.rows) : null;
  const parts = [scheme, movements].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(SUBLINE_PART_SEPARATOR) : null;
};

const structuralSubline = (composition: Composition): string | null => {
  const parts = formatCompositionSummary(composition).map((part) => part.text);

  return parts.length > 0 ? parts.join(SUBLINE_PART_SEPARATOR) : null;
};

export const buildSubline = (schema: BenchmarkPlannedSchema, resultType: ResultType): string => {
  const composition = parseComposition(schema.composition);

  if (composition !== null) {
    const faithful = faithfulSubline(schema, composition);

    if (faithful !== null) {
      return faithful;
    }

    const structural = structuralSubline(composition);

    if (structural !== null) {
      return structural;
    }
  }

  return BENCHMARK_LABEL_BY_RESULT_TYPE[resultType];
};

export const resolveBenchmarkTitle = (
  schema: BenchmarkPlannedSchema,
  plannedSchemaId: string,
): string => {
  const session = schema.block.session;

  return (
    schema.header ??
    session.label?.name ??
    session.day.label?.name ??
    schema.rows[0]?.exercise.canonicalName ??
    plannedSchemaId
  );
};
