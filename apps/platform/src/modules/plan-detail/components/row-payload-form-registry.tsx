import type { RowKind } from "@repo/contracts/lms/schema-row";

import {
  InnerLadderMarkerRowPayloadForm,
  innerLadderMarkerDefaultValue,
  toInnerLadderMarkerValue,
} from "./inner-ladder-marker-row-payload-form";
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
  REST: {
    Form: RestRowPayloadForm,
    defaultValue: restDefaultValue,
    toValue: toRestValue,
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
  INNER_LADDER_MARKER: {
    Form: InnerLadderMarkerRowPayloadForm,
    defaultValue: innerLadderMarkerDefaultValue,
    toValue: toInnerLadderMarkerValue,
  },
  REST_SLOT: {
    Form: RestSlotRowPayloadForm,
    defaultValue: restSlotDefaultValue,
    toValue: toRestSlotValue,
  },
} as Partial<Record<RowKind, ErasedRowPayloadFormEntry>>;
