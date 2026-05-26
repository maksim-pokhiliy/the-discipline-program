import { type SchemaWithBody } from "@repo/contracts/lms/schema";

const ROUNDS_SUFFIX = " rounds";
const TIMES_SEPARATOR = " × ";
const RANGE_SEPARATOR = "–";
const AMRAP_PREFIX = "AMRAP ";
const EMOM_PREFIX = "EMOM ";
const MIN_SUFFIX = " min";
const LADDER_SUFFIX = " ladder";
const THEMED_SETS_SUFFIX = " sets";
const SUPER_SET_PREFIX = "Super-set × ";
const SUPER_SET_SUFFIX = " rounds";
const RUN_PREFIX = "Run ";
const RUN_FALLBACK = "Run";
const SPACE = " ";
const ARROW_SEPARATOR = " → ";
const THEMED_FALLBACK = "Themed";
const N_ROUNDS_FALLBACK = "N rounds";
const PROGRAM_KIND_UNDERSCORE_RE = /_/g;
const PROGRAM_KIND_SPACE = " ";
const ARCHETYPE_DISCRIMINATOR_DASH_RE = /-/g;
const ARCHETYPE_DISCRIMINATOR_DASH_REPLACEMENT = " ";

const formatNRoundsHeader = (
  params: Extract<SchemaWithBody["schema"]["archetypeParams"], { archetype: "n-rounds" }>["params"],
): string => {
  if (
    params.countForm === "count_times_reps" &&
    params.count !== undefined &&
    params.repsPerSet !== undefined
  ) {
    return `${params.count}${TIMES_SEPARATOR}${params.repsPerSet}`;
  }

  if (params.countForm === "exact" && params.count !== undefined) {
    return `${params.count}${ROUNDS_SUFFIX}`;
  }

  if (params.countForm === "range" && params.countRange !== undefined) {
    return `${params.countRange.min}${RANGE_SEPARATOR}${params.countRange.max}${ROUNDS_SUFFIX}`;
  }

  return N_ROUNDS_FALLBACK;
};

const formatRunDistanceHeader = (
  params: Extract<
    SchemaWithBody["schema"]["archetypeParams"],
    { archetype: "run-distance" }
  >["params"],
): string => {
  const distance = params.distance;

  if (distance === undefined) {
    return RUN_FALLBACK;
  }

  if (distance.value !== undefined) {
    return `${RUN_PREFIX}${distance.value}${SPACE}${distance.unit}`;
  }

  if (distance.range !== undefined) {
    return `${RUN_PREFIX}${distance.range.min}${RANGE_SEPARATOR}${distance.range.max}${SPACE}${distance.unit}`;
  }

  return RUN_FALLBACK;
};

const formatFallback = (archetype: string, archetypeLabel: string | null): string => {
  if (archetypeLabel !== null) {
    return archetypeLabel;
  }

  return archetype.replace(
    ARCHETYPE_DISCRIMINATOR_DASH_RE,
    ARCHETYPE_DISCRIMINATOR_DASH_REPLACEMENT,
  );
};

export const formatSchemaHeader = (
  schema: SchemaWithBody,
  archetypeLabel: string | null,
): string => {
  const header = schema.schema.header;

  if (header !== null && header !== "") {
    return header;
  }

  const archetypeParams = schema.schema.archetypeParams;

  switch (archetypeParams.archetype) {
    case "n-rounds":
      return formatNRoundsHeader(archetypeParams.params);
    case "amrap-flat":
      return `${AMRAP_PREFIX}${archetypeParams.params.durationMin}${MIN_SUFFIX}`;
    case "emom-nested-per-minute":
      return `${EMOM_PREFIX}${archetypeParams.params.durationMin}${MIN_SUFFIX}`;
    case "ladder-descending":
    case "ladder-ascending":
      return `${archetypeParams.params.steps.join("-")}${LADDER_SUFFIX}`;
    case "named-themed-sets": {
      const theme = archetypeParams.params.theme;
      const themePrefix = theme.length > 0 ? theme : THEMED_FALLBACK;

      return `${themePrefix}${THEMED_SETS_SUFFIX}`;
    }
    case "named-exercise-program":
      return archetypeParams.params.program.programKind.replace(
        PROGRAM_KIND_UNDERSCORE_RE,
        PROGRAM_KIND_SPACE,
      );
    case "super-set":
      return `${SUPER_SET_PREFIX}${archetypeParams.params.rounds}${SUPER_SET_SUFFIX}`;
    case "run-distance":
      return formatRunDistanceHeader(archetypeParams.params);
    case "time-window-outer":
      return `${archetypeParams.params.window.startHhMm}${ARROW_SEPARATOR}${archetypeParams.params.window.endHhMm}`;
    default:
      return formatFallback(archetypeParams.archetype, archetypeLabel);
  }
};
