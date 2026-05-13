import { type Prisma } from "@prisma/client";

export const HEADERLESS_MODALITY_ARCHETYPES: Prisma.ArchetypeCreateManyInput[] = [
  {
    name: "single-line-with-then-connector",
    kind: "HEADERLESS",
    family: "SINGLE_LINE_HEADERLESS",
    headerPatternDescription: "no header",
    bodyLayoutDescription:
      "single exercise / movement row + trailing connector `then:` or `...then...:`",
    archetypeParamsSchema: { properties: {} },
    relatedArchetypes: [
      { kind: "paired_with", target: "single-line-bare" },
      { kind: "paired_with", target: "ladder-descending" },
      { kind: "continuation_of", target: "single-line-bare" },
    ],
  },
  {
    name: "single-line-bare",
    kind: "HEADERLESS",
    family: "SINGLE_LINE_HEADERLESS",
    headerPatternDescription: "no header",
    bodyLayoutDescription:
      "single exercise row with reps + optional position-marker; no trailing connector",
    archetypeParamsSchema: { properties: {} },
    relatedArchetypes: [
      { kind: "paired_with", target: "single-line-with-then-connector" },
      { kind: "continuation_of", target: "ladder-descending" },
    ],
  },
  {
    name: "single-line-total-counter",
    kind: "HEADERLESS",
    family: "SINGLE_LINE_HEADERLESS",
    headerPatternDescription: "no header",
    bodyLayoutDescription: "single row `N <exercise-variant> [ TOTAL ]`",
    archetypeParamsSchema: {
      required: ["totalFlag"],
      properties: { totalFlag: { type: "boolean", const: true } },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "n-rounds" },
      { kind: "specialization_of", target: "single-line-bare" },
    ],
  },
  {
    name: "flat-list-headerless",
    kind: "HEADERLESS",
    family: "FLAT_PARALLEL_HEADERLESS",
    headerPatternDescription: "no header",
    bodyLayoutDescription:
      "3..8 exercise rows (`<reps> <exercise> [ modifiers ]`) with no internal `X-Y-Z:` markers; optional internal rest-pauses",
    archetypeParamsSchema: { properties: {} },
    relatedArchetypes: [
      { kind: "specialization_of", target: "pull-ups-dips-cycle" },
      { kind: "extension_of", target: "placeholder-body" },
    ],
  },
  {
    name: "pull-ups-dips-cycle",
    kind: "HEADERLESS",
    family: "FLAT_PARALLEL_HEADERLESS",
    headerPatternDescription: "no header",
    bodyLayoutDescription:
      "6..8 paired rows of `<N> strict pull-ups` + `traverses + <M> bar dips ...` with cyclical descending counts; optional trailing `30 strict T2B`",
    archetypeParamsSchema: { properties: {} },
    relatedArchetypes: [
      { kind: "specialization_of", target: "flat-list-headerless" },
      { kind: "paired_with", target: "parallel-ladders-descending" },
    ],
  },
  {
    name: "run-distance",
    kind: "HEADERLESS",
    family: "MODALITY_REFERENCE",
    headerPatternDescription: "no header",
    bodyLayoutDescription:
      "single-line modality token `RUN [N km|N-M km]`, `[N km] RUN`, or bare `RUN`",
    archetypeParamsSchema: {
      required: ["modality"],
      properties: {
        modality: { type: "string", enum: ["RUN"] },
        distance: {
          type: "object",
          nullable: true,
          required: ["unit"],
          properties: {
            unit: { type: "string", enum: ["km"] },
            value: { type: "number", minimum: 0, nullable: true },
            range: {
              type: "object",
              nullable: true,
              required: ["min", "max"],
              properties: { min: { type: "number" }, max: { type: "number" } },
            },
          },
        },
      },
    },
    relatedArchetypes: [{ kind: "paired_with", target: "n-rounds" }],
  },
  {
    name: "placeholder-body",
    kind: "HEADERLESS",
    family: "MODALITY_REFERENCE",
    headerPatternDescription: "no header",
    bodyLayoutDescription:
      "1..2 placeholder rows (`biceps / triceps`, `ANY exercise for ABS`); optional concrete exercise row",
    archetypeParamsSchema: { properties: {} },
    relatedArchetypes: [{ kind: "extension_of", target: "flat-list-headerless" }],
  },
  {
    name: "practice-list",
    kind: "HEADERLESS",
    family: "MODALITY_REFERENCE",
    headerPatternDescription: "no header",
    bodyLayoutDescription:
      "1..2 rows `<exercise name> [ URL ]` without reps (practice-mode reference)",
    archetypeParamsSchema: { properties: {} },
    relatedArchetypes: [{ kind: "extension_of", target: "flat-list-headerless" }],
  },
  {
    name: "url-only-body",
    kind: "HEADERLESS",
    family: "MODALITY_REFERENCE",
    headerPatternDescription: "no header",
    bodyLayoutDescription: "1..2 URL-only rows (bracketed or bare) without exercise name and reps",
    archetypeParamsSchema: { properties: {} },
    relatedArchetypes: [{ kind: "specialization_of", target: "practice-list" }],
  },
];
