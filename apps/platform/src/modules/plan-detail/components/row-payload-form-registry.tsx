import type { RowKind } from "@repo/contracts/lms/schema-row";

import {
  ExerciseRowPayloadForm,
  exerciseDefaultValue,
  toExerciseValue,
} from "./exercise-row-payload-form";
import {
  PlaceholderRowPayloadForm,
  placeholderDefaultValue,
  toPlaceholderValue,
} from "./placeholder-row-payload-form";
import { RestRowPayloadForm, restDefaultValue, toRestValue } from "./rest-row-payload-form";
import {
  RestSlotRowPayloadForm,
  restSlotDefaultValue,
  toRestSlotValue,
} from "./rest-slot-row-payload-form";
import type { ErasedRowPayloadFormEntry } from "./row-editor-types";

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
  PLACEHOLDER: {
    Form: PlaceholderRowPayloadForm,
    defaultValue: placeholderDefaultValue,
    toValue: toPlaceholderValue,
  },
  REST_SLOT: {
    Form: RestSlotRowPayloadForm,
    defaultValue: restSlotDefaultValue,
    toValue: toRestSlotValue,
  },
} as Partial<Record<RowKind, ErasedRowPayloadFormEntry>>;
