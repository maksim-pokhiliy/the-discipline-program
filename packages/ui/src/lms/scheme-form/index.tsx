"use client";

import { type SchemeParams } from "@repo/contracts/lms/_domain";

import { SchemeFormCountDown } from "./scheme-form-count-down";
import { SchemeFormCountUp } from "./scheme-form-count-up";
import { SchemeFormEmomLoop } from "./scheme-form-emom-loop";
import { SchemeFormIntervalLoop } from "./scheme-form-interval-loop";
import { SchemeFormNone } from "./scheme-form-none";
import { SchemeFormTimeBoxed } from "./scheme-form-time-boxed";
import { type SchemeFormProps } from "./scheme-form.types";

const isSchemeParamsOfKind = <K extends SchemeParams["kind"]>(
  params: SchemeParams,
  kind: K,
): params is Extract<SchemeParams, { kind: K }> => params.kind === kind;

export const SchemeForm = ({
  archetypeKind,
  schemeParams,
  onChange,
  errors,
  disabled,
}: SchemeFormProps) => {
  if (schemeParams.kind !== archetypeKind) {
    return null;
  }

  if (isSchemeParamsOfKind(schemeParams, "NONE")) {
    return (
      <SchemeFormNone
        value={schemeParams}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    );
  }

  if (isSchemeParamsOfKind(schemeParams, "COUNT_UP")) {
    return (
      <SchemeFormCountUp
        value={schemeParams}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    );
  }

  if (isSchemeParamsOfKind(schemeParams, "COUNT_DOWN")) {
    return (
      <SchemeFormCountDown
        value={schemeParams}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    );
  }

  if (isSchemeParamsOfKind(schemeParams, "INTERVAL_LOOP")) {
    return (
      <SchemeFormIntervalLoop
        value={schemeParams}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    );
  }

  if (isSchemeParamsOfKind(schemeParams, "EMOM_LOOP")) {
    return (
      <SchemeFormEmomLoop
        value={schemeParams}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    );
  }

  return (
    <SchemeFormTimeBoxed
      value={schemeParams}
      onChange={onChange}
      errors={errors}
      disabled={disabled}
    />
  );
};

export { SchemeFormCountDown } from "./scheme-form-count-down";
export { SchemeFormCountUp } from "./scheme-form-count-up";
export { SchemeFormEmomLoop } from "./scheme-form-emom-loop";
export { SchemeFormIntervalLoop } from "./scheme-form-interval-loop";
export { SchemeFormNone } from "./scheme-form-none";
export { SchemeFormTimeBoxed } from "./scheme-form-time-boxed";
export type {
  SchemeFormCountDownProps,
  SchemeFormCountUpProps,
  SchemeFormEmomLoopProps,
  SchemeFormErrors,
  SchemeFormIntervalLoopProps,
  SchemeFormNoneProps,
  SchemeFormProps,
  SchemeFormTimeBoxedProps,
} from "./scheme-form.types";
