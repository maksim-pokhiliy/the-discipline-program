import type { RowKind } from "@repo/contracts/lms/schema-row";

import {
  ExerciseRowPayloadForm,
  exerciseDefaultValue,
  toExerciseValue,
} from "./exercise-row-payload-form";
import {
  FootnoteRowPayloadForm,
  footnoteDefaultValue,
  toFootnoteValue,
} from "./footnote-row-payload-form";
import {
  InnerLadderMarkerRowPayloadForm,
  innerLadderMarkerDefaultValue,
  toInnerLadderMarkerValue,
} from "./inner-ladder-marker-row-payload-form";
import {
  PlaceholderRowPayloadForm,
  placeholderDefaultValue,
  toPlaceholderValue,
} from "./placeholder-row-payload-form";
import {
  RepDefinitionRowPayloadForm,
  repDefinitionDefaultValue,
  toRepDefinitionValue,
} from "./rep-definition-row-payload-form";
import { RestRowPayloadForm, restDefaultValue, toRestValue } from "./rest-row-payload-form";
import {
  RestSlotRowPayloadForm,
  restSlotDefaultValue,
  toRestSlotValue,
} from "./rest-slot-row-payload-form";
import type { ErasedRowPayloadFormEntry } from "./row-editor-types";
import {
  StandaloneLoadRowPayloadForm,
  standaloneLoadDefaultValue,
  toStandaloneLoadValue,
} from "./standalone-load-row-payload-form";
import {
  StandaloneUrlRowPayloadForm,
  standaloneUrlDefaultValue,
  toStandaloneUrlValue,
} from "./standalone-url-row-payload-form";

export const ROW_PAYLOAD_FORM_REGISTRY = {
  EXERCISE: {
    Form: ExerciseRowPayloadForm,
    defaultValue: exerciseDefaultValue,
    toValue: toExerciseValue,
  },
  REST: {
    Form: RestRowPayloadForm,
    defaultValue: restDefaultValue,
    toValue: toRestValue,
  },
  FOOTNOTE: {
    Form: FootnoteRowPayloadForm,
    defaultValue: footnoteDefaultValue,
    toValue: toFootnoteValue,
  },
  STANDALONE_LOAD: {
    Form: StandaloneLoadRowPayloadForm,
    defaultValue: standaloneLoadDefaultValue,
    toValue: toStandaloneLoadValue,
  },
  STANDALONE_URL: {
    Form: StandaloneUrlRowPayloadForm,
    defaultValue: standaloneUrlDefaultValue,
    toValue: toStandaloneUrlValue,
  },
  PLACEHOLDER: {
    Form: PlaceholderRowPayloadForm,
    defaultValue: placeholderDefaultValue,
    toValue: toPlaceholderValue,
  },
  INNER_LADDER_MARKER: {
    Form: InnerLadderMarkerRowPayloadForm,
    defaultValue: innerLadderMarkerDefaultValue,
    toValue: toInnerLadderMarkerValue,
  },
  REP_DEFINITION: {
    Form: RepDefinitionRowPayloadForm,
    defaultValue: repDefinitionDefaultValue,
    toValue: toRepDefinitionValue,
  },
  REST_SLOT: {
    Form: RestSlotRowPayloadForm,
    defaultValue: restSlotDefaultValue,
    toValue: toRestSlotValue,
  },
} as Partial<Record<RowKind, ErasedRowPayloadFormEntry>>;
