import { createElement } from "react";

import type { ArchetypeName } from "@repo/contracts/lms/schema";

import {
  AlternatingSetsForm,
  alternatingSetsDefaultParams,
  toAlternatingSetsParams,
} from "./alternating-sets-schema-form";
import {
  AmrapFlatSchemaForm,
  amrapFlatDefaultParams,
  toAmrapFlatParams,
} from "./amrap-flat-schema-form";
import {
  CompositeIntervalsWRFixedForm,
  compositeIntervalsWRFixedDefaultParams,
  toCompositeIntervalsWRFixedParams,
} from "./composite-intervals-work-rest-fixed-schema-form";
import {
  CompositeIntervalsWRProgressiveForm,
  compositeIntervalsWRProgressiveDefaultParams,
  toCompositeIntervalsWRProgressiveParams,
} from "./composite-intervals-work-rest-progressive-schema-form";
import {
  CompositeRollingRoundsForm,
  compositeRollingRoundsDefaultParams,
  toCompositeRollingRoundsParams,
} from "./composite-rolling-rounds-schema-form";
import {
  CompositeRoundsWithRestForm,
  compositeRoundsWithRestDefaultParams,
  toCompositeRoundsWithRestParams,
} from "./composite-rounds-with-rest-schema-form";
import {
  EmomNestedForm,
  emomNestedDefaultParams,
  toEmomNestedParams,
} from "./emom-nested-schema-form";
import { EmomSlotForm, emomSlotDefaultParams, toEmomSlotParams } from "./emom-slot-schema-form";
import { ladderEntry } from "./ladder-entry";
import { NRoundsSchemaForm, nRoundsDefaultParams, toNRoundsParams } from "./n-rounds-schema-form";
import {
  NamedThemedSetsForm,
  namedThemedSetsDefaultParams,
  toNamedThemedSetsParams,
} from "./named-themed-sets-schema-form";
import {
  NestedCompositeOverLadderForm,
  nestedCompositeOverLadderDefaultParams,
  toNestedCompositeOverLadderParams,
} from "./nested-composite-over-ladder-schema-form";
import {
  NestedRoundsForm,
  nestedRoundsDefaultParams,
  toNestedRoundsParams,
} from "./nested-rounds-schema-form";
import { EmptyParamsForm } from "./no-params-notice";
import { parallelLaddersEntry } from "./parallel-ladders-entry";
import {
  PARALLEL_PYRAMIDS_DEFAULT,
  ParallelPyramidsForm,
  toParallelPyramidsParams,
} from "./parallel-pyramids-schema-form";
import {
  RunDistanceForm,
  runDistanceDefaultParams,
  toRunDistanceParams,
} from "./run-distance-schema-form";
import type { ParamsFor, SchemaParamFormEntry, SchemaParamFormProps } from "./schema-editor-types";
import {
  SingleLineTotalCounterForm,
  singleLineTotalCounterDefaultParams,
  toSingleLineTotalCounterParams,
} from "./single-line-total-counter-schema-form";
import {
  TimeWindowForm,
  timeWindowDefaultParams,
  toTimeWindowParams,
} from "./time-window-schema-form";

type EmptyParams = ParamsFor<"single-line-bare">;

const emptyParamsEntry = (archetype: ArchetypeName) => ({
  Form: (_props: SchemaParamFormProps<EmptyParams>) =>
    createElement(EmptyParamsForm, { archetype }),
  defaultParams: {} satisfies EmptyParams,
  toParams: (): EmptyParams => ({}),
});

export const SCHEMA_PARAM_FORM_REGISTRY: {
  [N in ArchetypeName]?: SchemaParamFormEntry<N>;
} = {
  "alternating-sets": {
    Form: AlternatingSetsForm,
    defaultParams: alternatingSetsDefaultParams,
    toParams: toAlternatingSetsParams,
  },
  "amrap-flat": {
    Form: AmrapFlatSchemaForm,
    defaultParams: amrapFlatDefaultParams,
    toParams: toAmrapFlatParams,
  },
  "composite-intervals-work-rest-fixed": {
    Form: CompositeIntervalsWRFixedForm,
    defaultParams: compositeIntervalsWRFixedDefaultParams,
    toParams: toCompositeIntervalsWRFixedParams,
  },
  "composite-intervals-work-rest-progressive": {
    Form: CompositeIntervalsWRProgressiveForm,
    defaultParams: compositeIntervalsWRProgressiveDefaultParams,
    toParams: toCompositeIntervalsWRProgressiveParams,
  },
  "composite-rolling-rounds": {
    Form: CompositeRollingRoundsForm,
    defaultParams: compositeRollingRoundsDefaultParams,
    toParams: toCompositeRollingRoundsParams,
  },
  "composite-rounds-with-rest": {
    Form: CompositeRoundsWithRestForm,
    defaultParams: compositeRoundsWithRestDefaultParams,
    toParams: toCompositeRoundsWithRestParams,
  },
  "emom-nested-per-minute": {
    Form: EmomNestedForm,
    defaultParams: emomNestedDefaultParams,
    toParams: toEmomNestedParams,
  },
  "emom-sub-minute-slot": {
    Form: EmomSlotForm,
    defaultParams: emomSlotDefaultParams,
    toParams: toEmomSlotParams,
  },
  "flat-list-headerless": emptyParamsEntry("flat-list-headerless"),
  "ladder-ascending": ladderEntry("ascending"),
  "ladder-descending": ladderEntry("descending"),
  "ladder-spike": ladderEntry("spike"),
  "ladder-vertex-down-pyramid": ladderEntry("vertex-down-pyramid"),
  "n-rounds": {
    Form: NRoundsSchemaForm,
    defaultParams: nRoundsDefaultParams,
    toParams: toNRoundsParams,
  },
  "named-themed-sets": {
    Form: NamedThemedSetsForm,
    defaultParams: namedThemedSetsDefaultParams,
    toParams: toNamedThemedSetsParams,
  },
  "nested-composite-rounds-over-ladder": {
    Form: NestedCompositeOverLadderForm,
    defaultParams: nestedCompositeOverLadderDefaultParams,
    toParams: toNestedCompositeOverLadderParams,
  },
  "nested-rounds-over-parallel-ladder": {
    Form: NestedRoundsForm,
    defaultParams: nestedRoundsDefaultParams,
    toParams: toNestedRoundsParams,
  },
  "nested-rounds-over-rounds": {
    Form: NestedRoundsForm,
    defaultParams: nestedRoundsDefaultParams,
    toParams: toNestedRoundsParams,
  },
  "parallel-ladders-descending": parallelLaddersEntry(false),
  "parallel-ladders-mixed-direction": parallelLaddersEntry(true),
  "parallel-pyramids": {
    Form: ParallelPyramidsForm,
    defaultParams: PARALLEL_PYRAMIDS_DEFAULT,
    toParams: toParallelPyramidsParams,
  },
  "placeholder-body": emptyParamsEntry("placeholder-body"),
  "practice-list": emptyParamsEntry("practice-list"),
  "pull-ups-dips-cycle": emptyParamsEntry("pull-ups-dips-cycle"),
  "run-distance": {
    Form: RunDistanceForm,
    defaultParams: runDistanceDefaultParams,
    toParams: toRunDistanceParams,
  },
  "single-line-bare": emptyParamsEntry("single-line-bare"),
  "single-line-total-counter": {
    Form: SingleLineTotalCounterForm,
    defaultParams: singleLineTotalCounterDefaultParams,
    toParams: toSingleLineTotalCounterParams,
  },
  "single-line-with-then-connector": emptyParamsEntry("single-line-with-then-connector"),
  "time-window-outer": {
    Form: TimeWindowForm,
    defaultParams: timeWindowDefaultParams,
    toParams: toTimeWindowParams,
  },
  "url-only-body": emptyParamsEntry("url-only-body"),
};
