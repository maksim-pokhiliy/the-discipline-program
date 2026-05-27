import { type CanonicalRow } from "../../canonical-schema.js";
import { type ExerciseCatalogEntry } from "../../canonical-schema.js";
import { exerciseCuid, rowCuid } from "../utils/cuid.js";
import { type ExerciseResolver } from "../utils/exercise-resolver.js";

const PHASE_7_EQUIPMENT_EXTRA = [
  "ROW_ERG",
  "ASSAULT_BIKE",
  "ATLAS_STONE",
  "JUMP_ROPE",
  "SKI_ERG",
  "SLED",
  "YOKE",
] as const;

const PHASE_7_EXERCISES: Pick<
  ExerciseCatalogEntry,
  "canonicalName" | "primaryEquipment" | "movementTypeTagPrimary" | "canonicalCompoundType"
>[] = [
  {
    canonicalName: "ROW_ERG row",
    primaryEquipment: "ROW_ERG",
    movementTypeTagPrimary: "LOCOMOTION",
    canonicalCompoundType: "ATOMIC",
  },
  {
    canonicalName: "back squat",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "SQUAT",
    canonicalCompoundType: "ATOMIC",
  },
  {
    canonicalName: "snatch",
    primaryEquipment: "BARBELL",
    movementTypeTagPrimary: "COMBINED_OLYMPIC",
    canonicalCompoundType: "ATOMIC",
  },
  {
    canonicalName: "DB row",
    primaryEquipment: "DUMBBELL",
    movementTypeTagPrimary: "PULL",
    canonicalCompoundType: "ATOMIC",
  },
  {
    canonicalName: "push-up",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "PRESS",
    canonicalCompoundType: "ATOMIC",
  },
  {
    canonicalName: "RUN moderate",
    primaryEquipment: "BODYWEIGHT",
    movementTypeTagPrimary: "LOCOMOTION",
    canonicalCompoundType: "ATOMIC",
  },
];

/** Inject Phase 7 specific exercises into the catalog (idempotent on canonicalName). */
export function ensurePhase7Catalog(catalog: ExerciseCatalogEntry[]): ExerciseCatalogEntry[] {
  const byName = new Set(catalog.map((e) => e.canonicalName));

  for (const p7 of PHASE_7_EXERCISES) {
    if (byName.has(p7.canonicalName)) {
      continue;
    }

    catalog.push({
      ref: exerciseCuid(p7.canonicalName),
      canonicalName: p7.canonicalName,
      primaryEquipment: p7.primaryEquipment,
      movementTypeTagPrimary: p7.movementTypeTagPrimary,
      movementTypeTagSecondary: null,
      defaultDemoUrls: [],
      canonicalCompoundType: p7.canonicalCompoundType,
      placeholderFlag: false,
      movementFamily: null,
      aliases: [],
      notes: "Injected by Phase 7 (out-of-sample expressiveness).",
    });
  }

  return catalog;
}

export interface Phase7SessionOutput {
  exampleId:
    | "phase-7-hr-z2-base-run"
    | "phase-7-numeric-pace-row-intervals"
    | "phase-7-tempo-back-squat"
    | "phase-7-snatch-wave"
    | "phase-7-strict-pull-up-cluster"
    | "phase-7-accessory-super-set";
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  order: number;
  label: string;
  notes: string | null;
  freezeLoadsAtCreation: boolean;
  blocks: import("../../canonical-schema.js").CanonicalBlock[];
}

const ENDURANCE_LABEL = "endurance";
const CONDITIONING_LABEL = "conditioning";
const STRENGTH_LABEL = "strength";
const OLYMPIC_LABEL = "olympic";
const ACCESSORY_LABEL = "accessory";
const SESSION_LABEL_REF = "1st-session";

const PHASE_7_BLOCK_REF = "block-198"; // placeholder ref — Session A reassigns

function exerciseRow(opts: {
  order: number;
  refId?: string;
  exerciseId: string;
  reps: CanonicalRow["reps"];
  load?: CanonicalRow["load"];
  intensity?: CanonicalRow["intensity"];
  tempo?: CanonicalRow["tempo"];
  position?: CanonicalRow["position"];
  side?: CanonicalRow["side"];
  sequence?: CanonicalRow["sequence"];
  media?: CanonicalRow["media"];
  compoundRep?: CanonicalRow["compoundRep"];
  notes?: string;
}): CanonicalRow {
  const r: CanonicalRow = {
    order: opts.order,
    rowKind: "EXERCISE",
    rowPayload: {
      rowKind: "EXERCISE",
      exercise: { form: "atomic", exerciseId: opts.exerciseId },
    },
    load: opts.load ?? null,
    reps: opts.reps,
    side: opts.side ?? null,
    tempo: opts.tempo ?? null,
    position: opts.position ?? null,
    sequence: opts.sequence ?? null,
    intensity: opts.intensity ?? null,
    media: opts.media ?? null,
    compoundRep: opts.compoundRep ?? null,
    notes: opts.notes ?? null,
  };

  if (opts.refId) {
    r.refId = opts.refId;
  }

  return r;
}

function restRow(opts: {
  order: number;
  raw: string;
  spec: import("@repo/contracts/lms/_shared").RestSpec;
}): CanonicalRow {
  return {
    order: opts.order,
    rowKind: "REST",
    rowPayload: { rowKind: "REST", raw: opts.raw, parsed: opts.spec },
    load: null,
    reps: null,
    side: null,
    tempo: null,
    position: null,
    sequence: null,
    intensity: null,
    media: null,
    compoundRep: null,
    notes: null,
  };
}

/** Build all 6 Phase 7 sessions. Fills out-of-sample coverage cells too. */
export function buildPhase7Sessions(resolver: ExerciseResolver): Phase7SessionOutput[] {
  const runRef = resolver.resolve("RUN");
  const runModerateRef = resolver.resolve("RUN moderate");
  const rowErgRef = resolver.resolve("ROW_ERG row");
  const backSquatRef = resolver.resolve("back squat");
  const snatchRef = resolver.resolve("snatch");
  const strictPullUpsRef = resolver.resolve("strict pull-ups");
  const dbRowRef = resolver.resolve("DB row");
  const pushUpRef = resolver.resolve("push-up");
  const dbBenchPressesRef = resolver.resolve("DB bench presses");
  const hamstringCurlsRef = resolver.resolve("hamstring curls");
  const dbHalfkneelingPressRef = resolver.resolve("DB halfkneeling press");
  const dbThrustersRef = resolver.resolve("DB thrusters");

  const sessions: Phase7SessionOutput[] = [];

  // §7.1 — HR Z2 base run (+ extra rows for Z1/Z3/Z4/Z5, pace=easy/moderate/hard/recovery, rpe).
  sessions.push({
    exampleId: "phase-7-hr-z2-base-run",
    dayOfWeek: "MONDAY",
    order: 1,
    label: SESSION_LABEL_REF,
    notes: "Phase 7 §7.1 — endurance with HR zones.",
    freezeLoadsAtCreation: false,
    blocks: [
      {
        blockInstanceRef: PHASE_7_BLOCK_REF,
        order: 10,
        labels: [ENDURANCE_LABEL],
        intensity: { hrZone: { zone: "Z2" } },
        timeCap: { min: 60, unit: "min" },
        notes: null,
        schemas: [
          {
            order: 10,
            kind: "HEADERLESS",
            archetype: { archetype: "run-distance", params: { modality: "RUN" } },
            header: null,
            intensity: null,
            notes: null,
            alternatingGroupRef: null,
            alternatingGroupRelation: null,
            rows: [
              exerciseRow({
                order: 10,
                exerciseId: runRef,
                reps: { kind: "unit_bound", unit: "min", value: 60 },
                intensity: { hrZone: { zone: "Z2" }, pace: "easy" },
              }),
              exerciseRow({
                order: 20,
                exerciseId: runRef,
                reps: { kind: "unit_bound", unit: "min", value: 30 },
                intensity: { hrZone: { zone: "Z1" }, pace: "recovery" },
              }),
              exerciseRow({
                order: 30,
                exerciseId: runModerateRef,
                reps: { kind: "unit_bound", unit: "min", value: 20 },
                intensity: { hrZone: { zone: "Z3" }, pace: "moderate" },
              }),
              exerciseRow({
                order: 40,
                exerciseId: runRef,
                reps: { kind: "unit_bound", unit: "min", value: 10 },
                intensity: { hrZone: { zone: "Z4" }, pace: "hard" },
              }),
              exerciseRow({
                order: 50,
                exerciseId: runRef,
                reps: { kind: "unit_bound", unit: "min", value: 5 },
                intensity: { hrZone: { zone: "Z5" }, rpe: { value: 9 } },
              }),
            ],
            subSchemas: [],
          },
        ],
      },
    ],
  });

  // §7.2 — Numeric pace row intervals + ROW_ERG + distance_per_min variant.
  const rowErgPairRefA = rowCuid("phase-7-row", "p2", 1);
  const rowErgPairRefB = rowCuid("phase-7-row", "p2", 2);

  sessions.push({
    exampleId: "phase-7-numeric-pace-row-intervals",
    dayOfWeek: "WEDNESDAY",
    order: 1,
    label: SESSION_LABEL_REF,
    notes: "Phase 7 §7.2 — pace + Equipment.ROW_ERG.",
    freezeLoadsAtCreation: false,
    blocks: [
      {
        blockInstanceRef: PHASE_7_BLOCK_REF,
        order: 10,
        labels: [CONDITIONING_LABEL],
        intensity: {
          numericPace: { value: "1:50", distanceUnit: "m", paceType: "min_per_distance" },
        },
        timeCap: null,
        notes: null,
        schemas: [
          {
            order: 10,
            kind: "ATOMIC",
            archetype: {
              archetype: "n-rounds",
              params: { countForm: "exact", count: 8 },
            },
            header: "8 sets:",
            intensity: null,
            notes: null,
            alternatingGroupRef: null,
            alternatingGroupRelation: null,
            rows: [
              exerciseRow({
                order: 10,
                refId: rowErgPairRefA,
                exerciseId: rowErgRef,
                reps: { kind: "unit_bound", unit: "km", value: 0.5 },
                intensity: {
                  numericPace: { value: "1:50", distanceUnit: "m", paceType: "min_per_distance" },
                },
              }),
              exerciseRow({
                order: 20,
                refId: rowErgPairRefB,
                exerciseId: rowErgRef,
                reps: { kind: "unit_bound", unit: "km", value: 0.25 },
                intensity: {
                  numericPace: { value: "300", distanceUnit: "m", paceType: "distance_per_min" },
                },
              }),
              restRow({
                order: 30,
                raw: "90 sec rest between sets",
                spec: {
                  duration: { value: 90, unit: "sec" },
                  scope: "between_sets",
                  qualifier: "fixed",
                },
              }),
            ],
            subSchemas: [],
          },
        ],
      },
    ],
  });

  // §7.3 — Tempo back squat with fullTempo + Load.percentage.reference.self + slow_eccentric + holdAfterLast.
  sessions.push({
    exampleId: "phase-7-tempo-back-squat",
    dayOfWeek: "TUESDAY",
    order: 1,
    label: SESSION_LABEL_REF,
    notes: "Phase 7 §7.3 — tempo + percentage self + RPE.",
    freezeLoadsAtCreation: false,
    blocks: [
      {
        blockInstanceRef: PHASE_7_BLOCK_REF,
        order: 10,
        labels: [STRENGTH_LABEL],
        intensity: null,
        timeCap: null,
        notes: null,
        schemas: [
          {
            order: 10,
            kind: "ATOMIC",
            archetype: {
              archetype: "n-rounds",
              params: { countForm: "count_times_reps", count: 5, repsPerSet: 5 },
            },
            header: "5x 5 reps:",
            intensity: null,
            notes: null,
            alternatingGroupRef: null,
            alternatingGroupRelation: null,
            rows: [
              exerciseRow({
                order: 10,
                exerciseId: backSquatRef,
                reps: { kind: "count", value: 5 },
                load: {
                  kind: "percentage",
                  value: 75,
                  reference: { scope: "self" },
                },
                tempo: {
                  fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 },
                },
                intensity: { rpe: { value: 8 } },
              }),
              exerciseRow({
                order: 20,
                exerciseId: backSquatRef,
                reps: { kind: "count", value: 5 },
                load: {
                  kind: "percentage",
                  value: 60,
                  reference: { scope: "movement_family", movementFamily: "squat" },
                },
                tempo: { slowEccentric: { durationSec: 4 } },
              }),
              exerciseRow({
                order: 30,
                exerciseId: backSquatRef,
                reps: { kind: "count", value: 5 },
                load: {
                  kind: "percentage",
                  value: 50,
                  reference: { scope: "other_exercise", targetExerciseId: snatchRef },
                },
                tempo: { holdAfterLast: { durationSec: 10 } },
              }),
            ],
            subSchemas: [],
          },
        ],
      },
    ],
  });

  // §7.4 — Snatch wave (named-exercise-program + StagedProgram wave). Also adds rangeMax percentage and max progressive (already covered in sample, but here too).
  sessions.push({
    exampleId: "phase-7-snatch-wave",
    dayOfWeek: "FRIDAY",
    order: 1,
    label: SESSION_LABEL_REF,
    notes: "Phase 7 §7.4 — StagedProgram wave + percentage stages.",
    freezeLoadsAtCreation: false,
    blocks: [
      {
        blockInstanceRef: PHASE_7_BLOCK_REF,
        order: 10,
        labels: [OLYMPIC_LABEL],
        intensity: null,
        timeCap: null,
        notes: null,
        schemas: [
          {
            order: 10,
            kind: "NAMED",
            archetype: {
              archetype: "named-exercise-program",
              params: {
                exerciseId: snatchRef,
                program: {
                  programKind: "wave",
                  stages: [
                    {
                      reps: 3,
                      load: { kind: "percentage", value: 70, reference: { scope: "self" } },
                    },
                    {
                      reps: 3,
                      load: { kind: "percentage", value: 80, reference: { scope: "self" } },
                    },
                    {
                      reps: 3,
                      load: { kind: "percentage", value: 90, reference: { scope: "self" } },
                    },
                  ],
                  restBetweenStages: {
                    duration: { value: 2, unit: "min" },
                    scope: "between_intervals",
                    qualifier: "fixed",
                  },
                },
              },
            },
            header: "Snatch:",
            intensity: null,
            notes: null,
            alternatingGroupRef: null,
            alternatingGroupRelation: null,
            rows: [],
            subSchemas: [],
          },
        ],
      },
    ],
  });

  // §7.5 — Strict pull-up cluster (named-exercise-program + cluster). Adds RestSpec setIndex + after_specific_set.
  sessions.push({
    exampleId: "phase-7-strict-pull-up-cluster",
    dayOfWeek: "THURSDAY",
    order: 1,
    label: SESSION_LABEL_REF,
    notes: "Phase 7 §7.5 — cluster + setIndex rest.",
    freezeLoadsAtCreation: true, // Q10 freezeLoadsAtCreation coverage
    blocks: [
      {
        blockInstanceRef: PHASE_7_BLOCK_REF,
        order: 10,
        labels: ["strength-endurance"],
        intensity: null,
        timeCap: null,
        notes: null,
        schemas: [
          {
            order: 10,
            kind: "NAMED",
            archetype: {
              archetype: "named-exercise-program",
              params: {
                exerciseId: strictPullUpsRef,
                program: {
                  programKind: "cluster",
                  setsCount: 5,
                  stageCountPerSet: 3,
                  stages: [
                    { reps: 3, load: { kind: "bodyweight" } },
                    { reps: 3, load: { kind: "bodyweight" } },
                    { reps: 3, load: { kind: "bodyweight" } },
                  ],
                  restBetweenStages: {
                    duration: { value: 15, unit: "sec" },
                    scope: "between_intervals",
                    qualifier: "fixed",
                  },
                },
              },
            },
            header: "Strict pull-ups:",
            intensity: null,
            notes: null,
            alternatingGroupRef: null,
            alternatingGroupRelation: null,
            rows: [
              restRow({
                order: 10,
                raw: "2 min REST BETWEEN SETS",
                spec: {
                  duration: { value: 2, unit: "min" },
                  scope: "between_sets",
                  qualifier: "fixed",
                },
              }),
              restRow({
                order: 20,
                raw: "3 min REST after set 3",
                spec: {
                  duration: { value: 3, unit: "min" },
                  scope: "after_specific_set",
                  qualifier: "fixed",
                  setIndex: 3,
                },
              }),
              restRow({
                order: 30,
                raw: "90-120 sec rest between sets",
                spec: {
                  duration: { value: 90, unit: "range_sec", rangeMax: 120 },
                  scope: "between_sets",
                  qualifier: "range",
                },
              }),
              restRow({
                order: 40,
                raw: "2-3 min rest in between rounds",
                spec: {
                  duration: { value: 2, unit: "range_min", rangeMax: 3 },
                  scope: "between_rounds",
                  qualifier: "range",
                },
              }),
            ],
            subSchemas: [],
          },
        ],
      },
    ],
  });

  // §7.5b — extra block: timeCap unit=sec + remaining positions (FROM_BOX, HAND_ON_DB, HANDS_ON_DB, HAND_ON_DB_NEUTRAL_GRIP)
  // Attached to the cluster session for compactness.
  sessions[sessions.length - 1]!.blocks.push({
    blockInstanceRef: PHASE_7_BLOCK_REF,
    order: 20,
    labels: [STRENGTH_LABEL],
    intensity: null,
    timeCap: { min: 30, unit: "sec" },
    notes: null,
    schemas: [
      {
        order: 10,
        kind: "ATOMIC",
        archetype: { archetype: "n-rounds", params: { countForm: "exact", count: 3 } },
        header: "3 sets:",
        intensity: null,
        notes: null,
        alternatingGroupRef: null,
        alternatingGroupRelation: null,
        rows: [
          exerciseRow({
            order: 10,
            exerciseId: pushUpRef,
            reps: { kind: "count", value: 5 },
            position: "FROM_BOX",
          }),
          exerciseRow({
            order: 20,
            exerciseId: pushUpRef,
            reps: { kind: "count", value: 5 },
            position: "HAND_ON_DB",
          }),
          exerciseRow({
            order: 30,
            exerciseId: pushUpRef,
            reps: { kind: "count", value: 5 },
            position: "HANDS_ON_DB",
          }),
          exerciseRow({
            order: 40,
            exerciseId: pushUpRef,
            reps: { kind: "count", value: 5 },
            position: "HAND_ON_DB_NEUTRAL_GRIP",
          }),
          exerciseRow({
            order: 50,
            exerciseId: pushUpRef,
            reps: { kind: "count", value: 5 },
            position: "FROM_SOFA_BOX",
          }),
        ],
        subSchemas: [],
      },
    ],
  });

  // §7.6 — Accessory super-set (archetype super-set + 2 SuperSetPairs + OrAlternative purposes + curly_brace compound-rep).
  const a1RowRef = rowCuid("phase-7-superset", "p6", 1);
  const a2RowRef = rowCuid("phase-7-superset", "p6", 2);
  const b1RowRef = rowCuid("phase-7-superset", "p6", 3);
  const b2RowRef = rowCuid("phase-7-superset", "p6", 4);

  sessions.push({
    exampleId: "phase-7-accessory-super-set",
    dayOfWeek: "SATURDAY",
    order: 1,
    label: SESSION_LABEL_REF,
    notes: "Phase 7 §7.6 — super-set + extra coverage rows for compound forms.",
    freezeLoadsAtCreation: false,
    blocks: [
      {
        blockInstanceRef: PHASE_7_BLOCK_REF,
        order: 10,
        labels: [ACCESSORY_LABEL],
        intensity: null,
        timeCap: null,
        notes: null,
        schemas: [
          {
            order: 10,
            kind: "ATOMIC",
            archetype: {
              archetype: "super-set",
              params: {
                rounds: 3,
                pairs: [
                  { label: "A1", schemaRows: [a1RowRef, a2RowRef] },
                  { label: "A2", schemaRows: [b1RowRef, b2RowRef] },
                ],
                restBetweenPairs: {
                  duration: { value: 60, unit: "sec" },
                  scope: "between_rounds",
                  qualifier: "fixed",
                },
              },
            },
            header: "Super-set A | 3 rounds:",
            intensity: null,
            notes: null,
            alternatingGroupRef: null,
            alternatingGroupRelation: null,
            rows: [
              exerciseRow({
                order: 10,
                refId: a1RowRef,
                exerciseId: dbRowRef,
                reps: { kind: "count", value: 12 },
                load: { kind: "absolute", weight: { variant: "dual", valueKg: 20 } },
              }),
              exerciseRow({
                order: 20,
                refId: a2RowRef,
                exerciseId: dbBenchPressesRef,
                reps: { kind: "count", value: 12 },
                load: {
                  kind: "absolute",
                  weight: {
                    variant: "compound_device",
                    equipment: "DUMBBELL",
                    count: 2,
                    valueKg: 20,
                  },
                },
              }),
              exerciseRow({
                order: 30,
                refId: b1RowRef,
                exerciseId: pushUpRef,
                reps: { kind: "count", value: 15 },
                load: { kind: "bodyweight" },
                compoundRep: {
                  form: "curly_brace",
                  composition: [
                    { exerciseId: pushUpRef, count: 1 },
                    { exerciseId: dbRowRef, count: 1 },
                  ],
                },
              }),
              exerciseRow({
                order: 40,
                refId: b2RowRef,
                exerciseId: dbHalfkneelingPressRef,
                reps: { kind: "count", value: 10 },
                load: { kind: "unspecified" },
                position: "NEUTRAL_GRIP",
              }),
              // OR-alternative purpose=equipment_substitute
              {
                order: 50,
                rowKind: "EXERCISE",
                rowPayload: {
                  rowKind: "EXERCISE",
                  exercise: {
                    form: "or_alternative",
                    orAlternative: {
                      primaryExerciseId: dbThrustersRef,
                      primaryReps: { kind: "count", value: 12 },
                      alternativeExerciseId: hamstringCurlsRef,
                      alternativeReps: { kind: "count", value: 15 },
                      purpose: "equipment_substitute",
                    },
                  },
                },
                load: null,
                reps: null,
                side: null,
                tempo: null,
                position: null,
                sequence: null,
                intensity: null,
                media: null,
                compoundRep: null,
                notes: null,
              },
              // OR-alternative purpose=coach_choice
              {
                order: 60,
                rowKind: "EXERCISE",
                rowPayload: {
                  rowKind: "EXERCISE",
                  exercise: {
                    form: "or_alternative",
                    orAlternative: {
                      primaryExerciseId: pushUpRef,
                      primaryReps: { kind: "count", value: 20 },
                      alternativeExerciseId: dbRowRef,
                      alternativeReps: { kind: "count", value: 20 },
                      purpose: "coach_choice",
                    },
                  },
                },
                load: null,
                reps: null,
                side: null,
                tempo: null,
                position: null,
                sequence: null,
                intensity: null,
                media: null,
                compoundRep: null,
                notes: null,
              },
              // cyclical compound row
              {
                order: 70,
                rowKind: "EXERCISE",
                rowPayload: {
                  rowKind: "EXERCISE",
                  exercise: {
                    form: "cyclical",
                    cyclical: {
                      primaryExerciseId: strictPullUpsRef,
                      secondaryExerciseId: resolver.resolve("strict bar dips"),
                      cycles: [{ secondaryReps: 5 }, { secondaryReps: 7 }, { secondaryReps: 9 }],
                    },
                  },
                },
                load: null,
                reps: null,
                side: null,
                tempo: null,
                position: null,
                sequence: { kind: "after_each_round" },
                intensity: null,
                media: null,
                compoundRep: null,
                notes: null,
              },
              // sandwich compound row (X + Y + X)
              {
                order: 80,
                rowKind: "EXERCISE",
                rowPayload: {
                  rowKind: "EXERCISE",
                  exercise: {
                    form: "sandwich",
                    sandwich: {
                      opening: {
                        exerciseId: dbBenchPressesRef,
                        reps: { kind: "count", value: 5 },
                        load: { kind: "absolute", weight: { variant: "dual", valueKg: 15 } },
                      },
                      middle: {
                        exerciseId: dbHalfkneelingPressRef,
                        reps: { kind: "count", value: 10 },
                      },
                      closing: {
                        exerciseId: dbBenchPressesRef,
                        reps: { kind: "count", value: 5 },
                        load: { kind: "absolute", weight: { variant: "dual", valueKg: 15 } },
                      },
                    },
                  },
                },
                load: null,
                reps: null,
                side: null,
                tempo: null,
                position: null,
                sequence: { kind: "after_each_typed_round", type: "GYMNASTICS" },
                intensity: null,
                media: null,
                compoundRep: null,
                notes: null,
              },
              // placeholder_ref form (referencing catalog placeholder exercise)
              {
                order: 90,
                rowKind: "EXERCISE",
                rowPayload: {
                  rowKind: "EXERCISE",
                  exercise: {
                    form: "placeholder_ref",
                    placeholderExerciseId: resolver.resolve("*DB exercise"),
                  },
                },
                load: null,
                reps: { kind: "compound_rep_unit" },
                side: null,
                tempo: null,
                position: null,
                sequence: null,
                intensity: null,
                media: null,
                compoundRep: null,
                notes: null,
              },
            ],
            subSchemas: [],
          },
        ],
      },
    ],
  });

  return sessions;
}

export const PHASE_7_EQUIPMENT_EXTRAS = PHASE_7_EQUIPMENT_EXTRA;
