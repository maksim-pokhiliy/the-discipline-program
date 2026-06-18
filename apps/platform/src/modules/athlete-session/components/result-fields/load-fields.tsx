import { type ReactElement } from "react";

import { LOAD_FIELD_LABEL } from "../../utils/athlete-session.constants";
import { LOAD_KEY, type ResultFieldsProps } from "../../utils/result-form-config";

import { ResultNumberField } from "./result-number-field";

export const LoadFields = ({ draft, onChange }: ResultFieldsProps): ReactElement => (
  <ResultNumberField
    fieldKey={LOAD_KEY}
    label={LOAD_FIELD_LABEL}
    draft={draft}
    onChange={onChange}
  />
);
