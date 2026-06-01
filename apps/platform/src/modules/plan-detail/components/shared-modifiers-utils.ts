import type { Load, TempoModifier } from "@repo/contracts/lms/_shared";

export const normalizeSharedModifiers = (sm: {
  load?: Load | undefined;
  tempo?: TempoModifier | undefined;
}): { load?: Load | undefined; tempo?: TempoModifier | undefined } | undefined =>
  sm.load === undefined && sm.tempo === undefined ? undefined : sm;
