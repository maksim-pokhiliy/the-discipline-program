import { type ReactElement } from "react";

import { Stack } from "@mui/material";

import {
  RESULT_FIELD_GAP_PX,
  REPS_FIELD_LABEL,
  ROUNDS_FIELD_LABEL,
} from "../../utils/athlete-session.constants";
import { REPS_KEY, type ResultFieldsProps, ROUNDS_KEY } from "../../utils/result-form-config";

import { ResultNumberField } from "./result-number-field";

export const RoundsRepsFields = ({ draft, onChange }: ResultFieldsProps): ReactElement => (
  <Stack direction="row" spacing={`${RESULT_FIELD_GAP_PX}px`}>
    <ResultNumberField
      fieldKey={ROUNDS_KEY}
      label={ROUNDS_FIELD_LABEL}
      draft={draft}
      onChange={onChange}
    />
    <ResultNumberField
      fieldKey={REPS_KEY}
      label={REPS_FIELD_LABEL}
      draft={draft}
      onChange={onChange}
    />
  </Stack>
);
