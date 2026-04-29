"use client";

import {
  schemeParamsSchema,
  type SchemeParams,
  type SchemeParamsCountDown,
  type SchemeParamsCountUp,
  type SchemeParamsEmomLoop,
  type SchemeParamsIntervalLoop,
  type SchemeParamsNone,
} from "@repo/contracts/lms/_domain";

import { SchemeFormCountDown } from "./scheme-form-count-down";
import { SchemeFormCountUp } from "./scheme-form-count-up";
import { SCHEME_PARAMS_DEFAULTS } from "./scheme-form-defaults";
import { SchemeFormEmomLoop } from "./scheme-form-emom-loop";
import { SchemeFormIntervalLoop } from "./scheme-form-interval-loop";
import { SchemeFormNone } from "./scheme-form-none";
import { type SchemeFormErrors } from "./scheme-form.types";

export type SchemeFormInnerKind = Exclude<SchemeParams["kind"], "TIME_BOXED">;

export type SchemeFormInnerValue =
  | SchemeParamsNone
  | SchemeParamsCountUp
  | SchemeParamsCountDown
  | SchemeParamsIntervalLoop
  | SchemeParamsEmomLoop;

export type SchemeFormInnerProps = {
  archetypeKind: SchemeFormInnerKind;
  innerParams: unknown;
  onChange: (next: SchemeFormInnerValue) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};

const isInnerSchemeParams = (params: SchemeParams): params is SchemeFormInnerValue =>
  params.kind !== "TIME_BOXED";

const coerceInner = (raw: unknown, expectedKind: SchemeFormInnerKind): SchemeFormInnerValue => {
  const parsed = schemeParamsSchema.safeParse(raw);

  if (parsed.success && parsed.data.kind === expectedKind && isInnerSchemeParams(parsed.data)) {
    return parsed.data;
  }

  return SCHEME_PARAMS_DEFAULTS[expectedKind];
};

export const SchemeFormInner = ({
  archetypeKind,
  innerParams,
  onChange,
  errors,
  disabled,
}: SchemeFormInnerProps) => {
  const value = coerceInner(innerParams, archetypeKind);

  if (value.kind === "NONE") {
    return <SchemeFormNone value={value} onChange={onChange} errors={errors} disabled={disabled} />;
  }

  if (value.kind === "COUNT_UP") {
    return (
      <SchemeFormCountUp value={value} onChange={onChange} errors={errors} disabled={disabled} />
    );
  }

  if (value.kind === "COUNT_DOWN") {
    return (
      <SchemeFormCountDown value={value} onChange={onChange} errors={errors} disabled={disabled} />
    );
  }

  if (value.kind === "INTERVAL_LOOP") {
    return (
      <SchemeFormIntervalLoop
        value={value}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
    );
  }

  return (
    <SchemeFormEmomLoop value={value} onChange={onChange} errors={errors} disabled={disabled} />
  );
};
