import { type Prisma } from "@prisma/client";

export const NESTED_NAMED_ARCHETYPES: Prisma.ArchetypeCreateManyInput[] = [
  {
    name: "nested-rounds-over-rounds",
    kind: "NESTED",
    family: "NESTED",
    headerPatternDescription: "`N sets:` or `N-M sets:` outer counter",
    bodyLayoutDescription: "1 atomic inner schema with `M rounds:` header + 2..3 exercise rows",
    archetypeParamsSchema: {
      required: ["outerCount"],
      properties: {
        outerCount: {
          oneOf: [
            { type: "integer", minimum: 1 },
            {
              type: "object",
              required: ["min", "max"],
              properties: { min: { type: "integer" }, max: { type: "integer" } },
            },
          ],
        },
      },
    },
    relatedArchetypes: [
      { kind: "extension_of", target: "n-rounds" },
      { kind: "specialization_of", target: "nested-rounds-over-parallel-ladder" },
    ],
  },
  {
    name: "nested-rounds-over-parallel-ladder",
    kind: "NESTED",
    family: "NESTED",
    headerPatternDescription: "`N sets:` or `N-M sets:` outer counter",
    bodyLayoutDescription: "1 headerless inner schema with parallel-ladder body + trailing rest",
    archetypeParamsSchema: {
      required: ["outerCount"],
      properties: {
        outerCount: {
          oneOf: [
            { type: "integer", minimum: 1 },
            {
              type: "object",
              required: ["min", "max"],
              properties: { min: { type: "integer" }, max: { type: "integer" } },
            },
          ],
        },
      },
    },
    relatedArchetypes: [
      { kind: "specialization_of", target: "nested-rounds-over-rounds" },
      { kind: "contains", target: "parallel-ladders-descending" },
    ],
  },
  {
    name: "nested-composite-rounds-over-ladder",
    kind: "NESTED",
    family: "NESTED",
    headerPatternDescription: "composite `N sets | X min rest in between sets:` outer",
    bodyLayoutDescription: "1 atomic inner ladder (typically descending)",
    archetypeParamsSchema: {
      required: ["outerCount", "rest"],
      properties: {
        outerCount: { type: "integer", minimum: 1 },
        rest: { type: "object" },
      },
    },
    relatedArchetypes: [
      { kind: "extension_of", target: "composite-rounds-with-rest" },
      { kind: "contains", target: "ladder-descending" },
    ],
  },
  {
    name: "named-themed-sets",
    kind: "NAMED",
    family: "NAMED",
    headerPatternDescription:
      "`N sets | <theme>:` or `N-M sets | <theme>:` such as `3 sets | shoulders:`",
    bodyLayoutDescription:
      "2..4 exercise rows with reps + per-exercise modifiers + optional URL annotations",
    archetypeParamsSchema: {
      required: ["count", "theme"],
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
        theme: { type: "string", minLength: 1 },
      },
    },
    relatedArchetypes: [{ kind: "specialization_of", target: "n-rounds" }],
  },
  {
    name: "named-exercise-program",
    kind: "NAMED",
    family: "NAMED",
    headerPatternDescription: "exercise name with `:` such as `Bulgarian split squats:`",
    bodyLayoutDescription:
      "StagedProgram in `[ ]` brackets (drop_set / wave / cluster); optional demo URL and `- REST IN BETWEEN SETS UNTIL RECOVERY -`",
    archetypeParamsSchema: {
      required: ["exerciseId", "program"],
      properties: {
        exerciseId: { type: "string", minLength: 1 },
        program: {
          type: "object",
          required: ["programKind", "stages"],
          properties: {
            programKind: { type: "string", enum: ["drop_set", "wave", "cluster"] },
            stages: { type: "array", minItems: 1 },
            setsCount: { type: "integer", minimum: 1, nullable: true },
            stageCountPerSet: { type: "integer", minimum: 1, nullable: true },
            separatorForm: { type: "string", nullable: true },
            mediaPerStage: { type: "object", nullable: true },
            restBetweenStages: { type: "object", nullable: true },
          },
        },
      },
    },
    relatedArchetypes: [{ kind: "specialization_of", target: "n-rounds" }],
  },
];
