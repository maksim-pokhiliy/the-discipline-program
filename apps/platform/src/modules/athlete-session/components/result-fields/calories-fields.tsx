import { type ReactElement } from "react";

import { CALORIES_FIELD_LABEL } from "../../utils/athlete-session.constants";
import { CALORIES_KEY, type ResultFieldsProps } from "../../utils/result-form-config";

import { ResultNumberField } from "./result-number-field";

export const CaloriesFields = ({ draft, onChange }: ResultFieldsProps): ReactElement => (
  <ResultNumberField
    fieldKey={CALORIES_KEY}
    label={CALORIES_FIELD_LABEL}
    draft={draft}
    onChange={onChange}
  />
);
