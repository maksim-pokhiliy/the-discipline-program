import { type Prisma } from "@prisma/client";

export const TIME_COMPOSITE_ARCHETYPES: Prisma.ArchetypeCreateManyInput[] = [
  {
    name: "amrap-flat",
    label: "AMRAP",
    kind: "ATOMIC",
    family: "TIME_CAP",
    headerPatternDescription: "`AMRAP N min:`",
    bodyLayoutDescription:
      "optional intensity modifier `[ N% Effort ]` + 2..4 exercise rows with rep counts",
    archetypeParamsSchema: {
      required: ["durationMin"],
      properties: { durationMin: { type: "integer", minimum: 1 } },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "emom-nested-per-minute" },
      { kind: "specialization_of", target: "n-rounds" },
    ],
  },
  {
    name: "emom-nested-per-minute",
    label: "EMOM",
    kind: "NESTED",
    family: "TIME_CAP",
    headerPatternDescription: "`EMOM N min:` or composite `EMOM N min | M rounds:`",
    bodyLayoutDescription:
      "2..4 atomic sub-schemas describing minute slots (singleton or grouped minutes)",
    archetypeParamsSchema: {
      required: ["durationMin"],
      properties: {
        durationMin: { type: "integer", minimum: 1 },
        rounds: { type: "integer", minimum: 1, nullable: true },
      },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "emom-sub-minute-slot" },
      { kind: "specialization_of", target: "composite-rounds-with-rest" },
    ],
  },
  {
    name: "emom-sub-minute-slot",
    label: "EMOM minute slot",
    kind: "ATOMIC",
    family: "TIME_CAP",
    headerPatternDescription:
      "`<minute-slot>:` such as `1 min:` (single) or `1st & 2nd min:` (grouped)",
    bodyLayoutDescription:
      "1..3 exercise rows with reps; or single `REST` line; or `MAX <exercise> [ in remaining time ]`",
    archetypeParamsSchema: {
      required: ["slot"],
      properties: {
        slot: {
          oneOf: [
            {
              type: "object",
              required: ["kind", "minute"],
              properties: {
                kind: { type: "string", enum: ["single"] },
                minute: { type: "integer", minimum: 1 },
              },
            },
            {
              type: "object",
              required: ["kind", "minutes"],
              properties: {
                kind: { type: "string", enum: ["grouped"] },
                minutes: {
                  type: "array",
                  minItems: 2,
                  items: { type: "integer", minimum: 1 },
                },
              },
            },
          ],
        },
      },
    },
    relatedArchetypes: [{ kind: "contained_by", target: "emom-nested-per-minute" }],
  },
  {
    name: "time-window-outer",
    label: "Time window",
    kind: "NESTED",
    family: "TIME_CAP",
    headerPatternDescription: "`Hbegin:MMbegin-Hend:MMend min:` such as `0:00-10:00 min:`",
    bodyLayoutDescription: "single atomic sub-schema (rounds or ladder) describing inner work",
    archetypeParamsSchema: {
      required: ["window"],
      properties: {
        window: {
          type: "object",
          required: ["startHhMm", "endHhMm"],
          properties: {
            startHhMm: { type: "string", pattern: "^\\d{1,2}:[0-5]\\d$" },
            endHhMm: { type: "string", pattern: "^\\d{1,2}:[0-5]\\d$" },
          },
        },
      },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "amrap-flat" },
      { kind: "paired_with", target: "emom-nested-per-minute" },
    ],
  },
  {
    name: "composite-rounds-with-rest",
    label: "Rounds with rest",
    kind: "COMPOSITE",
    family: "COMPOSITE_ROUNDS",
    headerPatternDescription:
      "`N rounds | X min rest in between rounds`, `N rounds | X min REST after each round:`, or `N sets | X min rest in between sets:`",
    bodyLayoutDescription:
      "1..N exercise rows with reps + modifiers; optional `...then N rounds:` continuation",
    archetypeParamsSchema: {
      required: ["count", "rest"],
      properties: {
        count: {
          oneOf: [
            { type: "integer", minimum: 1 },
            {
              type: "object",
              required: ["min", "max"],
              properties: { min: { type: "integer" }, max: { type: "integer" } },
            },
          ],
        },
        rest: { type: "object" },
      },
    },
    relatedArchetypes: [
      { kind: "extension_of", target: "n-rounds" },
      { kind: "specialization_of", target: "composite-intervals-then-rounds" },
    ],
  },
  {
    name: "composite-intervals-then-rounds",
    label: "Intervals → rounds",
    kind: "COMPOSITE",
    family: "COMPOSITE_ROUNDS",
    headerPatternDescription: "`N INTERVALS | X min rest in between`",
    bodyLayoutDescription:
      "preamble exercise row + `...then N rounds:` connector + 2..3 inner exercise rows",
    archetypeParamsSchema: {
      required: ["intervalsCount", "restMin", "innerRounds", "preambleExercise", "preambleReps"],
      properties: {
        intervalsCount: { type: "integer", minimum: 1 },
        restMin: { type: "number", minimum: 0 },
        innerRounds: { type: "integer", minimum: 1 },
        preambleExercise: { type: "object" },
        preambleReps: { type: "object" },
      },
    },
    relatedArchetypes: [{ kind: "specialization_of", target: "composite-rounds-with-rest" }],
  },
  {
    name: "composite-intervals-work-rest-fixed",
    label: "Work / rest intervals",
    kind: "COMPOSITE",
    family: "COMPOSITE_ROUNDS",
    headerPatternDescription: "`Nx X min WORK | Y min REST`",
    bodyLayoutDescription: "2..3 exercise rows with fixed reps (no MAX-notation)",
    archetypeParamsSchema: {
      required: ["intervalsCount", "workMin", "restMin"],
      properties: {
        intervalsCount: { type: "integer", minimum: 1 },
        workMin: { type: "number", minimum: 0 },
        restMin: { type: "number", minimum: 0 },
      },
    },
    relatedArchetypes: [
      { kind: "specialization_of", target: "composite-intervals-work-rest-progressive" },
    ],
  },
  {
    name: "composite-intervals-work-rest-progressive",
    label: "Progressive intervals",
    kind: "COMPOSITE",
    family: "COMPOSITE_ROUNDS",
    headerPatternDescription: "`N sets | X min WORK | Y min OFF:`",
    bodyLayoutDescription:
      "preamble (warm-up reps) + `MAX ROUNDS in remaining time: <progressive seed>` + exercise list + EXAMPLE annotation",
    archetypeParamsSchema: {
      required: ["sets", "workMin", "offMin", "progressiveSeed"],
      properties: {
        sets: { type: "integer", minimum: 1 },
        workMin: { type: "number", minimum: 0 },
        offMin: { type: "number", minimum: 0 },
        progressiveSeed: { type: "string", minLength: 1 },
      },
    },
    relatedArchetypes: [
      { kind: "specialization_of", target: "composite-intervals-work-rest-fixed" },
      { kind: "paired_with", target: "composite-intervals-on-off-max-tail" },
    ],
  },
  {
    name: "composite-intervals-on-off-max-tail",
    label: "On / off + max tail",
    kind: "COMPOSITE",
    family: "COMPOSITE_ROUNDS",
    headerPatternDescription: "`Nx X min ON | Y min OFF`",
    bodyLayoutDescription:
      "2 exercise rows with fixed reps + tail row `MAX <exercise> in remaining time`",
    archetypeParamsSchema: {
      required: ["intervals", "onMin", "offMin", "tailExerciseId"],
      properties: {
        intervals: { type: "integer", minimum: 1 },
        onMin: { type: "number", minimum: 0 },
        offMin: { type: "number", minimum: 0 },
        tailExerciseId: { type: "string", minLength: 1 },
      },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "composite-intervals-work-rest-progressive" },
    ],
  },
  {
    name: "composite-rolling-rounds",
    label: "Rolling rounds",
    kind: "COMPOSITE",
    family: "COMPOSITE_ROUNDS",
    headerPatternDescription: "`Every Nth min new round | xM rounds | T min`",
    bodyLayoutDescription: "2..3 exercise rows with reps describing rolling-EMOM cadence",
    archetypeParamsSchema: {
      required: ["everyNthMin", "rounds", "totalMin"],
      properties: {
        everyNthMin: { type: "integer", minimum: 1 },
        rounds: { type: "integer", minimum: 1 },
        totalMin: { type: "integer", minimum: 1 },
      },
    },
    relatedArchetypes: [{ kind: "paired_with", target: "emom-nested-per-minute" }],
  },
];
