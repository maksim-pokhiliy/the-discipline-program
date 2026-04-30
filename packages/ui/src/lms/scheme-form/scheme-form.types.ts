import { type z } from "zod";

import {
  type SchemeArchetypeKind,
  type SchemeParams,
  type SchemeParamsCountDown,
  type SchemeParamsCountUp,
  type SchemeParamsEmomLoop,
  type SchemeParamsIntervalLoop,
  type SchemeParamsNone,
  type SchemeParamsTimeBoxed,
} from "@repo/contracts/lms/_domain";

export type SchemeFormErrors = z.ZodError | null;

export type SchemeFormProps = {
  archetypeKind: SchemeArchetypeKind;
  schemeParams: SchemeParams;
  onChange: (next: SchemeParams) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};

export type SchemeFormNoneProps = {
  value: SchemeParamsNone;
  onChange: (next: SchemeParamsNone) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};

export type SchemeFormCountUpProps = {
  value: SchemeParamsCountUp;
  onChange: (next: SchemeParamsCountUp) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};

export type SchemeFormCountDownProps = {
  value: SchemeParamsCountDown;
  onChange: (next: SchemeParamsCountDown) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};

export type SchemeFormIntervalLoopProps = {
  value: SchemeParamsIntervalLoop;
  onChange: (next: SchemeParamsIntervalLoop) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};

export type SchemeFormEmomLoopProps = {
  value: SchemeParamsEmomLoop;
  onChange: (next: SchemeParamsEmomLoop) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};

export type SchemeFormTimeBoxedProps = {
  value: SchemeParamsTimeBoxed;
  onChange: (next: SchemeParamsTimeBoxed) => void;
  errors?: SchemeFormErrors;
  disabled?: boolean;
};
