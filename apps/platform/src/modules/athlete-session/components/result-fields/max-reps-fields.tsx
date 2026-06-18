import { type ReactElement } from "react";

import { MAX_REPS_FIELD_LABEL } from "../../utils/athlete-session.constants";
import { MAX_REPS_KEY, type ResultFieldsProps } from "../../utils/result-form-config";

import { ResultNumberField } from "./result-number-field";

export const MaxRepsFields = ({ draft, onChange }: ResultFieldsProps): ReactElement => (
  <ResultNumberField
    fieldKey={MAX_REPS_KEY}
    label={MAX_REPS_FIELD_LABEL}
    draft={draft}
    onChange={onChange}
  />
);
