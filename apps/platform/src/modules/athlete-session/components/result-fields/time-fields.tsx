import { type ReactElement } from "react";

import { Stack } from "@mui/material";

import {
  RESULT_FIELD_GAP_PX,
  TIME_MINUTES_LABEL,
  TIME_SECONDS_LABEL,
} from "../../utils/athlete-session.constants";
import {
  type ResultFieldsProps,
  TIME_MINUTES_KEY,
  TIME_SECONDS_KEY,
} from "../../utils/result-form-config";

import { ResultNumberField } from "./result-number-field";

export const TimeFields = ({ draft, onChange }: ResultFieldsProps): ReactElement => (
  <Stack direction="row" spacing={`${RESULT_FIELD_GAP_PX}px`}>
    <ResultNumberField
      fieldKey={TIME_MINUTES_KEY}
      label={TIME_MINUTES_LABEL}
      draft={draft}
      onChange={onChange}
    />
    <ResultNumberField
      fieldKey={TIME_SECONDS_KEY}
      label={TIME_SECONDS_LABEL}
      draft={draft}
      onChange={onChange}
    />
  </Stack>
);
