import { type Prisma } from "@prisma/client";

export const ROUNDS_LADDER_ARCHETYPES: Prisma.ArchetypeCreateManyInput[] = [
  {
    name: "n-rounds",
    kind: "ATOMIC",
    family: "ROUNDS_SETS",
    headerPatternDescription:
      "single count + optional reps annotation (`N rounds:`, `N-M rounds:`, `N sets:`, `Nx M reps:`); optional bracket-annotation suffix",
    bodyLayoutDescription:
      "1..N exercise rows with reps + modifiers; optional trailing rest-marker or `...then N rounds:` continuation",
    archetypeParamsSchema: {
      required: ["countForm"],
      properties: {
        countForm: { type: "string", enum: ["exact", "range", "count_times_reps"] },
        count: { type: "integer", minimum: 1 },
        countRange: {
          type: "object",
          required: ["min", "max"],
          properties: { min: { type: "integer" }, max: { type: "integer" } },
        },
        repsPerSet: { type: "integer", minimum: 1 },
        rest: { type: "object", nullable: true },
      },
    },
    relatedArchetypes: [
      { kind: "extension_of", target: "composite-rounds-with-rest" },
      { kind: "continuation_of", target: "composite-intervals-then-rounds" },
    ],
  },
  {
    name: "alternating-sets",
    kind: "ATOMIC",
    family: "ROUNDS_SETS",
    headerPatternDescription: "`<set-enumeration> sets:` such as `1st | 3rd | 5th sets:`",
    bodyLayoutDescription: "exercise list shared across all enumerated set indices",
    archetypeParamsSchema: {
      required: ["setEnumeration"],
      properties: {
        setEnumeration: { type: "array", items: { type: "integer", minimum: 1 } },
        pairedWithSchemaId: { type: "string", nullable: true },
      },
    },
    relatedArchetypes: [{ kind: "specialization_of", target: "n-rounds" }],
  },
  {
    name: "super-set",
    kind: "ATOMIC",
    family: "ROUNDS_SETS",
    headerPatternDescription: "`Super-set <label> | <N> rounds:`",
    bodyLayoutDescription:
      "ordered SchemaRows referenced by SuperSetPair[].schemaRows; outer loop = rounds, inner = pairs",
    archetypeParamsSchema: {
      required: ["pairs", "rounds"],
      properties: {
        pairs: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["label", "schemaRows"],
            properties: {
              label: { type: "string", minLength: 1 },
              schemaRows: { type: "array", minItems: 2, items: { type: "string" } },
            },
          },
        },
        rounds: { type: "integer", minimum: 1 },
        restBetweenPairs: { type: "object", nullable: true },
      },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "alternating-sets" },
      { kind: "specialization_of", target: "n-rounds" },
    ],
  },
  {
    name: "ladder-descending",
    kind: "ATOMIC",
    family: "LADDER",
    headerPatternDescription: "strictly descending `N1-N2-...-Nk:` (k=3..10)",
    bodyLayoutDescription: "single exercise or compound row; optional trailing footnote",
    archetypeParamsSchema: {
      required: ["steps"],
      properties: {
        steps: { type: "array", minItems: 3, items: { type: "integer", minimum: 1 } },
      },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "ladder-ascending" },
      { kind: "specialization_of", target: "parallel-ladders-descending" },
      { kind: "continuation_of", target: "single-line-with-then-connector" },
    ],
  },
  {
    name: "ladder-ascending",
    kind: "ATOMIC",
    family: "LADDER",
    headerPatternDescription: "strictly ascending `N1-N2-...-Nk:` (k=3..5)",
    bodyLayoutDescription: "single exercise or compound row; optional trailing T2B footnote",
    archetypeParamsSchema: {
      required: ["steps"],
      properties: {
        steps: { type: "array", minItems: 3, items: { type: "integer", minimum: 1 } },
      },
    },
    relatedArchetypes: [{ kind: "paired_with", target: "ladder-descending" }],
  },
  {
    name: "ladder-vertex-down-pyramid",
    kind: "ATOMIC",
    family: "LADDER",
    headerPatternDescription:
      "symmetric sequence with central minimum `N1-...-Nmid-...-N1:` (descending then ascending)",
    bodyLayoutDescription: "2-3 exercise rows with optional per-round footnote",
    archetypeParamsSchema: {
      required: ["steps"],
      properties: {
        steps: { type: "array", minItems: 5, items: { type: "integer", minimum: 1 } },
      },
    },
    relatedArchetypes: [
      { kind: "specialization_of", target: "ladder-descending" },
      { kind: "paired_with", target: "parallel-pyramids" },
    ],
  },
  {
    name: "ladder-spike",
    kind: "ATOMIC",
    family: "LADDER",
    headerPatternDescription:
      "descending sequence with final upward-spike step `N1-...-Nk-Nupper:`",
    bodyLayoutDescription: "2 exercise rows with optional trailing T2B",
    archetypeParamsSchema: {
      required: ["steps"],
      properties: {
        steps: { type: "array", minItems: 4, items: { type: "integer", minimum: 1 } },
      },
    },
    relatedArchetypes: [{ kind: "specialization_of", target: "ladder-descending" }],
  },
  {
    name: "parallel-ladders-descending",
    kind: "HEADERLESS",
    family: "LADDER",
    headerPatternDescription:
      "no header; body contains multiple descending `N-M-K:` ladder markers",
    bodyLayoutDescription:
      "alternating InnerLadderMarker + ExerciseRow pairs (2..3 ladders) executed in parallel rounds",
    archetypeParamsSchema: {
      required: ["ladders"],
      properties: {
        ladders: {
          type: "array",
          minItems: 2,
          items: {
            type: "object",
            required: ["steps"],
            properties: {
              steps: { type: "array", items: { type: "integer", minimum: 1 } },
              pairedWithInnerRowId: { type: "string", nullable: true },
              direction: { type: "string", enum: ["asc", "desc"], nullable: true },
            },
          },
        },
      },
    },
    relatedArchetypes: [
      { kind: "specialization_of", target: "ladder-descending" },
      { kind: "paired_with", target: "parallel-ladders-mixed-direction" },
      { kind: "paired_with", target: "parallel-pyramids" },
      { kind: "extension_of", target: "nested-rounds-over-parallel-ladder" },
    ],
  },
  {
    name: "parallel-ladders-mixed-direction",
    kind: "HEADERLESS",
    family: "LADDER",
    headerPatternDescription:
      "no header; body contains 2 ladders with opposite directions (one ascending, one descending) plus rest marker",
    bodyLayoutDescription:
      "2 InnerLadderMarker+ExerciseRow pairs with mixed asc/desc direction; trailing rest-marker",
    archetypeParamsSchema: {
      required: ["ladders"],
      properties: {
        ladders: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: {
            type: "object",
            required: ["steps", "direction"],
            properties: {
              steps: { type: "array", items: { type: "integer", minimum: 1 } },
              direction: { type: "string", enum: ["asc", "desc"] },
              pairedWithInnerRowId: { type: "string", nullable: true },
            },
          },
        },
      },
    },
    relatedArchetypes: [{ kind: "specialization_of", target: "parallel-ladders-descending" }],
  },
  {
    name: "parallel-pyramids",
    kind: "HEADERLESS",
    family: "LADDER",
    headerPatternDescription: "no header; body contains 2 parallel symmetric pyramid sequences",
    bodyLayoutDescription: "2 pyramids with identical steps + per-row exercise",
    archetypeParamsSchema: {
      required: ["pyramids"],
      properties: {
        pyramids: {
          type: "array",
          minItems: 2,
          items: {
            type: "object",
            required: ["steps"],
            properties: {
              steps: { type: "array", items: { type: "integer", minimum: 1 } },
              pairedWithInnerRowId: { type: "string", nullable: true },
              direction: { type: "string", enum: ["asc", "desc"], nullable: true },
            },
          },
        },
      },
    },
    relatedArchetypes: [
      { kind: "specialization_of", target: "parallel-ladders-descending" },
      { kind: "paired_with", target: "ladder-vertex-down-pyramid" },
    ],
  },
];
