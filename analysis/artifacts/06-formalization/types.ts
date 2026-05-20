import type {
  Week,
  Day,
  Session,
  Block,
  BlockLabelAssignment,
  Schema as PrismaSchema,
  AlternatingGroup,
  SchemaRow,
  Exercise,
  Label,
  Archetype,
  OneRMRecord,
  PerformedSession,
  PerformedExerciseInstance,
  Equipment,
  MovementType,
  CanonicalCompoundType,
  SchemaKind,
  RowKind,
  ArchetypeFamily,
  Position,
  OneRMRecordSource,
  AlternatingGroupRelation,
  AppLevel,
  DayOfWeek,
} from "@prisma/client";

export type {
  Week,
  Day,
  Session,
  Block,
  BlockLabelAssignment,
  PrismaSchema,
  AlternatingGroup,
  SchemaRow,
  Exercise,
  Label,
  Archetype,
  OneRMRecord,
  PerformedSession,
  PerformedExerciseInstance,
  Equipment,
  MovementType,
  CanonicalCompoundType,
  SchemaKind,
  RowKind,
  ArchetypeFamily,
  Position,
  OneRMRecordSource,
  AlternatingGroupRelation,
  AppLevel,
  DayOfWeek,
};

export type PaceValue = "easy" | "moderate" | "hard" | "recovery";

export type EffortPercent = { value: number } | { range: { min: number; max: number } };

export type HrZone = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

export type NumericPaceDistanceUnit = "km" | "mi" | "m" | "yd" | "lap";

export type NumericPaceType = "min_per_distance" | "distance_per_min";

export interface NumericPace {
  value: string;
  distanceUnit: NumericPaceDistanceUnit;
  paceType: NumericPaceType;
}

export interface Intensity {
  effortPercent?: EffortPercent;
  rpe?: { value: number };
  pace?: PaceValue;
  hrZone?: { zone: HrZone };
  numericPace?: NumericPace;
}

export type Weight =
  | { variant: "single"; valueKg: number }
  | { variant: "dual"; valueKg: number }
  | { variant: "single_arm"; valueKg: number }
  | {
      variant: "compound_device";
      equipment: Equipment;
      count: 1 | 2;
      valueKg: number;
    }
  | {
      variant: "split_tier";
      stages: { reps: number; equipment: Equipment; valueKg: number }[];
    }
  | {
      variant: "dual_value";
      first: number;
      second: number;
      resolver: "athlete_profile";
    }
  | {
      variant: "with_asymmetric_arm";
      valueKg: number;
      workingArm: "left" | "right";
      passiveArmAction: "hold_in_up" | "hold_static" | "hold_with_extra_weight";
      passiveExtraWeight?: { equipment: Equipment; valueKg: number };
    }
  | {
      variant: "with_depth_modifier";
      valueKg: number;
      depth: "to_parallel" | "full_rom" | "partial";
    };

export type PercentageReference =
  | { scope: "self" }
  | { scope: "movement_family"; movementFamily: string }
  | { scope: "other_exercise"; targetExerciseId: string };

export type Load =
  | { kind: "absolute"; weight: Weight }
  | {
      kind: "percentage";
      value: number;
      rangeMax?: number;
      reference: PercentageReference;
    }
  | { kind: "bodyweight" }
  | { kind: "without_weight"; context: "drop_set_stage" }
  | { kind: "unspecified" };

export type RepUnit = "sec" | "min" | "km";

export type RepNotation =
  | { kind: "count"; value: number }
  | { kind: "range"; min: number; max: number }
  | {
      kind: "unit_bound";
      unit: RepUnit;
      value?: number;
      range?: { min: number; max: number };
    }
  | {
      kind: "max";
      subForm: "bare" | "progressive" | "in_remaining_time";
      progressiveSeed?: string;
      targetExerciseId?: string;
    }
  | { kind: "implicit" }
  | { kind: "total_flag"; value: number }
  | { kind: "compound_rep_unit" };

export type CompoundRepDefinition =
  | {
      form: "curly_brace";
      composition: { exerciseId: string; count: number }[];
    }
  | {
      form: "inline_equality";
      totalReps: number;
      composition: { exerciseId: string; count: number }[];
    };

export type PerLimbDistribution =
  | { kind: "each_leg"; countPerLimb?: number }
  | { kind: "each_arm"; countPerLimb?: number }
  | {
      kind: "explicit_split";
      side: "left" | "right";
      pairedRowId?: string;
    }
  | { kind: "alternating"; sourceAnnotation?: string };

export interface FullTempo {
  eccentric: number;
  pauseBottom: number;
  concentric: number;
  pauseTop: number;
}

export interface TempoModifier {
  pauseInUp?: { durationSec: number; position?: "up" };
  perNthRepPause?: { everyN: number; pauseSec: number };
  slowEccentric?: { durationSec: number };
  holdAfterLast?: { durationSec: number };
  fullTempo?: FullTempo;
}

export type SequenceIndicator =
  | { kind: "before_named"; targetLabel: string }
  | { kind: "after_named"; targetLabel: string }
  | {
      kind: "before_named_after_named_composite";
      beforeLabel: string;
      afterLabel: string;
    }
  | { kind: "only_once_before"; targetLabel: string }
  | { kind: "after_each_round" }
  | { kind: "after_each_typed_round"; type: string };

export type StageIndicator = "explode" | "without_weight";

export type StagedProgramKind = "drop_set" | "wave" | "cluster";

export interface Stage {
  reps: number | RepNotation;
  load?: Load;
  indicator?: StageIndicator;
  label?: string;
  media?: MediaReference;
}

export interface StagedProgram {
  programKind: StagedProgramKind;
  stages: Stage[];
  setsCount?: number;
  stageCountPerSet?: number;
  separatorForm?: "...then...";
  mediaPerStage?: Record<number, MediaReference>;
  restBetweenStages?: RestSpec;
}

export interface PerSetSubstitutionAssignment {
  setIndex: number;
  exerciseId?: string;
  inlineCompound?: CompoundRow;
}

export interface PerSetSubstitution {
  placeholderName: string;
  assignments: PerSetSubstitutionAssignment[];
}

export type OrAlternativePurpose = "scale_down" | "equipment_substitute" | "coach_choice";

export interface OrAlternative {
  primaryExerciseId: string;
  primaryReps: RepNotation;
  alternativeExerciseId: string;
  alternativeReps: RepNotation;
  purpose: OrAlternativePurpose;
}

export type MediaPosition = "inline" | "standalone_row" | "bare";
export type MediaAppliesTo = "previous_row" | "current_row" | "whole_schema" | "drop_stage";

export interface MediaReference {
  url: string;
  position: MediaPosition;
  label?: string;
  appliesTo: MediaAppliesTo;
}

export interface TimeCap {
  min: number;
  max?: number;
  unit: "min" | "sec";
}

export interface CyclicalCompoundCycle {
  primaryReps?: number;
  secondaryReps: number;
}

export interface CyclicalCompound {
  primaryExerciseId: string;
  secondaryExerciseId: string;
  cycles: CyclicalCompoundCycle[];
  optionalRotationStepExerciseId?: string;
}

export interface SandwichCompoundElement {
  exerciseId: string;
  reps: RepNotation;
  load?: Load;
}

export interface SandwichCompound {
  opening: SandwichCompoundElement;
  middle: SandwichCompoundElement;
  closing: SandwichCompoundElement;
  sharedModifiers?: {
    tempo?: TempoModifier;
    load?: Load;
  };
}

export interface CompoundRowElement {
  exerciseId: string;
  reps: RepNotation;
  load?: Load;
  side?: PerLimbDistribution;
}

export interface CompoundRow {
  elements: CompoundRowElement[];
  sharedModifiers?: {
    load?: Load;
    tempo?: TempoModifier;
  };
}

export type PlaceholderKind = "muscle_group_reference" | "purpose_category" | "coach_choice_slot";

export interface PlaceholderPayload {
  placeholderKind: PlaceholderKind;
  text: string;
  perSetAssignments?: PerSetSubstitution;
  pairedConcreteRowId?: string;
}

export type ExerciseForm =
  | { form: "atomic"; exerciseId: string }
  | { form: "compound"; compound: CompoundRow }
  | { form: "cyclical"; cyclical: CyclicalCompound }
  | { form: "sandwich"; sandwich: SandwichCompound }
  | { form: "or_alternative"; orAlternative: OrAlternative }
  | { form: "placeholder_ref"; placeholderExerciseId: string };

export type RestScope =
  | "between_sets"
  | "between_rounds"
  | "between_intervals"
  | "after_specific_set";

export type RestQualifier = "until_recovery" | "fixed" | "range";

export interface RestSpec {
  duration: {
    value: number;
    unit: "sec" | "min" | "range_sec" | "range_min";
    rangeMax?: number;
  };
  scope: RestScope;
  qualifier?: RestQualifier;
  setIndex?: number;
}

export type FootnoteTarget = "each_round" | "each_set" | "each_typed_round";

export type StandaloneLoadScope = "applies_to_all_preceding_rows";

export type ConnectorForm = "then" | "then_dots" | "then_n_rounds";

export type SchemaRowPayload =
  | { rowKind: "EXERCISE"; exercise: ExerciseForm }
  | { rowKind: "REST"; raw: string; parsed: RestSpec }
  | {
      rowKind: "FOOTNOTE";
      marker: "*" | "**";
      target: FootnoteTarget;
      content: CompoundRow;
      typeLabel?: string;
    }
  | {
      rowKind: "STANDALONE_LOAD";
      load: Load;
      scope: StandaloneLoadScope;
    }
  | {
      rowKind: "STANDALONE_URL";
      url: string;
      wrapped: boolean;
      appliesTo: "previous_exercise_row" | "whole_schema";
    }
  | {
      rowKind: "PLACEHOLDER";
      placeholder: PlaceholderPayload;
    }
  | { rowKind: "INNER_LADDER_MARKER"; steps: number[] }
  | {
      rowKind: "REP_DEFINITION";
      equality: Extract<CompoundRepDefinition, { form: "inline_equality" }>;
    }
  | { rowKind: "REST_SLOT" };

export type SlotSpec = { kind: "single"; minute: number } | { kind: "grouped"; minutes: number[] };

export type CountForm = "exact" | "range" | "count_times_reps";

export type ExactOrRange = number | { min: number; max: number };

export interface LadderArchetypeParams {
  steps: number[];
}

export interface ParallelLadderEntry {
  steps: number[];
  pairedWithInnerRowId?: string;
  direction?: "asc" | "desc";
}

export interface ArchetypeRoundsSetsParams {
  countForm: CountForm;
  count?: number;
  countRange?: { min: number; max: number };
  repsPerSet?: number;
  rest?: RestSpec;
}

export interface ArchetypeAlternatingSetsParams {
  setEnumeration: number[];
}

export interface ArchetypeAmrapFlatParams {
  durationMin: number;
}

export interface ArchetypeEmomNestedParams {
  durationMin: number;
  rounds?: number;
}

export interface ArchetypeEmomSubSlotParams {
  slot: SlotSpec;
}

export interface ArchetypeTimeWindowOuterParams {
  window: { startHhMm: string; endHhMm: string };
}

export interface ArchetypeCompositeRoundsWithRestParams {
  count: ExactOrRange;
  rest: RestSpec;
}

export interface ArchetypeCompositeIntervalsThenRoundsParams {
  intervalsCount: number;
  restMin: number;
  innerRounds: number;
  preambleExercise: ExerciseForm;
  preambleReps: RepNotation;
}

export interface ArchetypeCompositeIntervalsWorkRestFixedParams {
  intervalsCount: number;
  workMin: number;
  restMin: number;
}

export interface ArchetypeCompositeIntervalsWorkRestProgressiveParams {
  sets: number;
  workMin: number;
  offMin: number;
  progressiveSeed: string;
}

export interface ArchetypeCompositeIntervalsOnOffMaxTailParams {
  intervals: number;
  onMin: number;
  offMin: number;
  tailExerciseId: string;
}

export interface ArchetypeCompositeRollingRoundsParams {
  everyNthMin: number;
  rounds: number;
  totalMin: number;
}

export interface ArchetypeNestedRoundsOverRoundsParams {
  outerCount: ExactOrRange;
}

export interface ArchetypeNestedRoundsOverParallelLadderParams {
  outerCount: ExactOrRange;
}

export interface ArchetypeNestedCompositeRoundsOverLadderParams {
  outerCount: number;
  rest: RestSpec;
}

export interface ArchetypeNamedThemedSetsParams {
  count: ExactOrRange;
  theme: string;
}

export interface ArchetypeNamedExerciseProgramParams {
  exerciseId: string;
  program: StagedProgram;
}

export interface ArchetypeRunDistanceParams {
  modality: "RUN";
  distance?: {
    unit: "km";
    value?: number;
    range?: { min: number; max: number };
  };
}

export type SchemaRowRef = string;

export interface SuperSetPair {
  label: string;
  schemaRows: SchemaRowRef[];
}

export interface ArchetypeSuperSetParams {
  pairs: SuperSetPair[];
  restBetweenPairs?: RestSpec;
  rounds: number;
}

export interface ArchetypeSingleLineTotalCounterParams {
  totalFlag: true;
}

export interface ArchetypeParallelLaddersDescendingParams {
  ladders: ParallelLadderEntry[];
}

export interface ArchetypeParallelLaddersMixedDirectionParams {
  ladders: ParallelLadderEntry[];
}

export interface ArchetypeParallelPyramidsParams {
  pyramids: ParallelLadderEntry[];
}

export type ArchetypeName =
  | "n-rounds"
  | "alternating-sets"
  | "ladder-descending"
  | "ladder-ascending"
  | "ladder-vertex-down-pyramid"
  | "ladder-spike"
  | "parallel-ladders-descending"
  | "parallel-ladders-mixed-direction"
  | "parallel-pyramids"
  | "amrap-flat"
  | "emom-nested-per-minute"
  | "emom-sub-minute-slot"
  | "time-window-outer"
  | "composite-rounds-with-rest"
  | "composite-intervals-then-rounds"
  | "composite-intervals-work-rest-fixed"
  | "composite-intervals-work-rest-progressive"
  | "composite-intervals-on-off-max-tail"
  | "composite-rolling-rounds"
  | "nested-rounds-over-rounds"
  | "nested-rounds-over-parallel-ladder"
  | "nested-composite-rounds-over-ladder"
  | "named-themed-sets"
  | "named-exercise-program"
  | "single-line-with-then-connector"
  | "single-line-bare"
  | "single-line-total-counter"
  | "flat-list-headerless"
  | "pull-ups-dips-cycle"
  | "run-distance"
  | "placeholder-body"
  | "practice-list"
  | "url-only-body"
  | "super-set";

export type ArchetypeParams =
  | { archetype: "n-rounds"; params: ArchetypeRoundsSetsParams }
  | { archetype: "alternating-sets"; params: ArchetypeAlternatingSetsParams }
  | { archetype: "ladder-descending"; params: LadderArchetypeParams }
  | { archetype: "ladder-ascending"; params: LadderArchetypeParams }
  | { archetype: "ladder-vertex-down-pyramid"; params: LadderArchetypeParams }
  | { archetype: "ladder-spike"; params: LadderArchetypeParams }
  | {
      archetype: "parallel-ladders-descending";
      params: ArchetypeParallelLaddersDescendingParams;
    }
  | {
      archetype: "parallel-ladders-mixed-direction";
      params: ArchetypeParallelLaddersMixedDirectionParams;
    }
  | { archetype: "parallel-pyramids"; params: ArchetypeParallelPyramidsParams }
  | { archetype: "amrap-flat"; params: ArchetypeAmrapFlatParams }
  | { archetype: "emom-nested-per-minute"; params: ArchetypeEmomNestedParams }
  | { archetype: "emom-sub-minute-slot"; params: ArchetypeEmomSubSlotParams }
  | {
      archetype: "time-window-outer";
      params: ArchetypeTimeWindowOuterParams;
    }
  | {
      archetype: "composite-rounds-with-rest";
      params: ArchetypeCompositeRoundsWithRestParams;
    }
  | {
      archetype: "composite-intervals-then-rounds";
      params: ArchetypeCompositeIntervalsThenRoundsParams;
    }
  | {
      archetype: "composite-intervals-work-rest-fixed";
      params: ArchetypeCompositeIntervalsWorkRestFixedParams;
    }
  | {
      archetype: "composite-intervals-work-rest-progressive";
      params: ArchetypeCompositeIntervalsWorkRestProgressiveParams;
    }
  | {
      archetype: "composite-intervals-on-off-max-tail";
      params: ArchetypeCompositeIntervalsOnOffMaxTailParams;
    }
  | {
      archetype: "composite-rolling-rounds";
      params: ArchetypeCompositeRollingRoundsParams;
    }
  | {
      archetype: "nested-rounds-over-rounds";
      params: ArchetypeNestedRoundsOverRoundsParams;
    }
  | {
      archetype: "nested-rounds-over-parallel-ladder";
      params: ArchetypeNestedRoundsOverParallelLadderParams;
    }
  | {
      archetype: "nested-composite-rounds-over-ladder";
      params: ArchetypeNestedCompositeRoundsOverLadderParams;
    }
  | { archetype: "named-themed-sets"; params: ArchetypeNamedThemedSetsParams }
  | {
      archetype: "named-exercise-program";
      params: ArchetypeNamedExerciseProgramParams;
    }
  | { archetype: "single-line-with-then-connector"; params: Record<string, never> }
  | { archetype: "single-line-bare"; params: Record<string, never> }
  | {
      archetype: "single-line-total-counter";
      params: ArchetypeSingleLineTotalCounterParams;
    }
  | { archetype: "flat-list-headerless"; params: Record<string, never> }
  | { archetype: "pull-ups-dips-cycle"; params: Record<string, never> }
  | { archetype: "run-distance"; params: ArchetypeRunDistanceParams }
  | { archetype: "placeholder-body"; params: Record<string, never> }
  | { archetype: "practice-list"; params: Record<string, never> }
  | { archetype: "url-only-body"; params: Record<string, never> }
  | { archetype: "super-set"; params: ArchetypeSuperSetParams };

export type TrailingConnector = {
  form: ConnectorForm;
  roundsCount?: number;
};

export type StageActual = {
  stageIndex: number;
  actualLoad: Load;
  actualReps: RepNotation;
  notes?: string;
};

export interface SchemaWithBody {
  schema: PrismaSchema;
  rows: SchemaRow[];
  subSchemas: SchemaWithBody[];
}

export interface BlockHydrated {
  block: Block;
  labels: { assignment: BlockLabelAssignment; label: Label }[];
  intensity?: Intensity;
  timeCap?: TimeCap;
  schemas: SchemaWithBody[];
}
