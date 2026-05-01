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

export type SchemeFormCommonProps = {
  errors?: SchemeFormErrors | undefined;
  disabled?: boolean | undefined;
};

export type SchemeFormProps = SchemeFormCommonProps & {
  archetypeKind: SchemeArchetypeKind;
  schemeParams: SchemeParams;
  onChange: (next: SchemeParams) => void;
};

export type SchemeFormNoneProps = SchemeFormCommonProps & {
  value: SchemeParamsNone;
  onChange: (next: SchemeParamsNone) => void;
};

export type SchemeFormCountUpProps = SchemeFormCommonProps & {
  value: SchemeParamsCountUp;
  onChange: (next: SchemeParamsCountUp) => void;
};

export type SchemeFormCountDownProps = SchemeFormCommonProps & {
  value: SchemeParamsCountDown;
  onChange: (next: SchemeParamsCountDown) => void;
};

export type SchemeFormIntervalLoopProps = SchemeFormCommonProps & {
  value: SchemeParamsIntervalLoop;
  onChange: (next: SchemeParamsIntervalLoop) => void;
};

export type SchemeFormEmomLoopProps = SchemeFormCommonProps & {
  value: SchemeParamsEmomLoop;
  onChange: (next: SchemeParamsEmomLoop) => void;
};

export type SchemeFormTimeBoxedProps = SchemeFormCommonProps & {
  value: SchemeParamsTimeBoxed;
  onChange: (next: SchemeParamsTimeBoxed) => void;
};
