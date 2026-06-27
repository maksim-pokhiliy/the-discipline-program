import { type Block } from "@repo/contracts/lms/block";
import {
  type Composition,
  formatBenchmarkSummary,
  formatCapSummary,
  formatRepetitionLabel,
  formatRestSpec,
} from "@repo/contracts/lms/composition";
import { type RowGroup, buildRowItems } from "@repo/contracts/lms/row-group";
import {
  type ExerciseById,
  buildEffectiveIntensityTexts,
  buildRowSummaryTexts,
  resolveIntensity,
} from "@repo/contracts/lms/row-text";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { type SchemaRow } from "@repo/contracts/lms/schema-row";

const EXERCISE_FALLBACK = "exercise";
const PART_SEPARATOR = " ";
const LABEL_SEPARATOR = " | ";
const NAME_LABEL_SEPARATOR = " · ";
const INTENSITY_SEPARATOR = " ";
const LINE_SEPARATOR = "\n";
const SCHEMA_BODY_SEPARATOR = "\n\n";
const BLANK_LINE = "";
const HEADER_SUFFIX = ":";
const BRACKET_OPEN = "[ ";
const BRACKET_CLOSE = " ]";
const HEADER_INTENSITY_LEVEL = "schema";

type RepetitionKind = NonNullable<Composition["repetition"]>["kind"];

const STRUCTURE_APPEND_KINDS = new Set<RepetitionKind>([
  "count",
  "timeCap",
  "cadence",
  "interval",
  "ladder",
]);
const TRAILING_HEADER_PUNCTUATION = /[\s:]+$/u;

const bracket = (text: string): string => `${BRACKET_OPEN}${text}${BRACKET_CLOSE}`;

const normalizeHeader = (header: string | null): string =>
  (header ?? "").trim().replace(TRAILING_HEADER_PUNCTUATION, "");

const TIME_CAP_KIND = "timeCap";
const CAP_LABEL_PREFIX = "cap ";
const AMRAP_LABEL_PREFIX = "AMRAP ";

const structureLabel = (composition: Composition): string | null => {
  const label = formatRepetitionLabel(composition);

  if (
    label !== null &&
    composition.repetition?.kind === TIME_CAP_KIND &&
    label.startsWith(CAP_LABEL_PREFIX)
  ) {
    return `${AMRAP_LABEL_PREFIX}${label.slice(CAP_LABEL_PREFIX.length)}`;
  }

  return label;
};

const labelLeadToken = (label: string): string => label.split(PART_SEPARATOR)[0] ?? label;

const headerConveysLabel = (header: string, label: string): boolean =>
  header.toLowerCase().includes(labelLeadToken(label).toLowerCase());

const resolveHeaderBase = (
  header: string,
  label: string | null,
  repetitionKind: RepetitionKind | undefined,
): string => {
  if (label === null) {
    return header;
  }

  if (label.toLowerCase().startsWith(header.toLowerCase())) {
    return label;
  }

  const shouldAppend =
    repetitionKind !== undefined &&
    STRUCTURE_APPEND_KINDS.has(repetitionKind) &&
    !headerConveysLabel(header, label);

  return shouldAppend ? `${header}${NAME_LABEL_SEPARATOR}${label}` : header;
};

const buildStructureText = (composition: Composition | null, header: string): string => {
  if (composition === null) {
    return header;
  }

  const label = structureLabel(composition);
  const extras = [formatCapSummary(composition), formatBenchmarkSummary(composition)].filter(
    (part): part is string => part !== null,
  );
  const base =
    header === "" ? label : resolveHeaderBase(header, label, composition.repetition?.kind);

  return [base, ...extras].filter((part): part is string => part !== null).join(LABEL_SEPARATOR);
};

const buildHeaderLine = (schema: SchemaWithBody, block: Block): string => {
  const structure = buildStructureText(
    schema.schema.composition,
    normalizeHeader(schema.schema.header),
  );
  const resolved = resolveIntensity(block.intensity, schema.schema.intensity, null);
  const intensity = buildEffectiveIntensityTexts(resolved, HEADER_INTENSITY_LEVEL)
    .map((text) => text.text)
    .join(INTENSITY_SEPARATOR);
  const parts = [structure, intensity].filter((part) => part !== "");

  return parts.length > 0 ? `${parts.join(LABEL_SEPARATOR)}${HEADER_SUFFIX}` : "";
};

const buildMovementLine = (
  row: SchemaRow,
  schema: SchemaWithBody,
  block: Block,
  exerciseById: ExerciseById,
): string => {
  const summary = buildRowSummaryTexts(row, exerciseById, {
    blockIntensity: block.intensity,
    schemaIntensity: schema.schema.intensity,
  });
  const name = exerciseById.get(row.exerciseId)?.canonicalName ?? EXERCISE_FALLBACK;
  const parts: string[] = [];

  if (summary.volume !== null) {
    parts.push(summary.volume);
  }

  parts.push(name);

  if (summary.load !== null) {
    parts.push(bracket(summary.load));
  }

  if (summary.side !== null) {
    parts.push(summary.side);
  }

  if (summary.tempo !== null) {
    parts.push(bracket(summary.tempo));
  }

  for (const chip of summary.intensityTexts) {
    if (!chip.inherited) {
      parts.push(chip.text);
    }
  }

  for (const modifier of summary.modifiers) {
    parts.push(bracket(modifier));
  }

  if (summary.rest !== null) {
    parts.push(summary.rest);
  }

  return parts.join(PART_SEPARATOR);
};

const rowGroupLabel = (group: RowGroup): string | null => {
  const note = group.notes?.[0];

  return note === undefined ? null : `${normalizeHeader(note)}${HEADER_SUFFIX}`;
};

const buildBodyLines = (
  schema: SchemaWithBody,
  block: Block,
  exerciseById: ExerciseById,
): string[] => {
  const lines: string[] = [];

  for (const item of buildRowItems(schema.rows, schema.rowGroups)) {
    if (item.kind === "row") {
      lines.push(buildMovementLine(item.row, schema, block, exerciseById));
      continue;
    }

    const label = rowGroupLabel(item.group);

    if (label !== null) {
      lines.push(label);
    } else if (lines.length > 0) {
      lines.push(BLANK_LINE);
    }

    for (const row of item.members) {
      lines.push(buildMovementLine(row, schema, block, exerciseById));
    }
  }

  return lines;
};

export const buildSchemaEntry = (
  schema: SchemaWithBody,
  block: Block,
  exerciseById: ExerciseById,
): string => {
  const headerLine = buildHeaderLine(schema, block);
  const movementLines = buildBodyLines(schema, block, exerciseById);
  const restSpec = schema.schema.composition?.rest;
  const body = restSpec ? [...movementLines, formatRestSpec(restSpec)] : movementLines;

  if (headerLine !== "" && body.length > 0) {
    return `${headerLine}${SCHEMA_BODY_SEPARATOR}${body.join(LINE_SEPARATOR)}`;
  }

  if (headerLine !== "") {
    return headerLine;
  }

  return body.join(LINE_SEPARATOR);
};
