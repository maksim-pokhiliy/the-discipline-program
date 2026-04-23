import {
  SCHEME_KIND_LABELS,
  SCHEME_PARAM_KEYS,
  SchemeKind,
  type SchemeParamKey,
} from "@repo/contracts/library/scheme";

export const SCHEME_KIND_OPTIONS: { value: SchemeKind; label: string }[] = Object.values(
  SchemeKind,
).map((kind) => ({ value: kind, label: SCHEME_KIND_LABELS[kind] }));

export const SCHEME_PARAM_OPTIONS: { value: SchemeParamKey; label: string }[] =
  SCHEME_PARAM_KEYS.map((key) => ({ value: key, label: key }));
