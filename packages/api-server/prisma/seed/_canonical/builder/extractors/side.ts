import { type PerLimbDistribution } from "@repo/contracts/lms/_shared";

const COUNT_PER_LEG_RE = /^(\d+)(?:\s+reps)?\s+each\s+leg$/i;
const COUNT_PER_ARM_RE = /^(\d+)(?:\s+reps)?\s+each\s+arm$/i;

/** Try interpreting bracket inner as PerLimbDistribution. */
export function tryParseSide(inner: string): PerLimbDistribution | null {
  const txt = inner.trim();

  if (/^each\s+leg$/i.test(txt)) {
    return { kind: "each_leg" };
  }

  if (/^each\s+arm$/i.test(txt)) {
    return { kind: "each_arm" };
  }

  if (/^alternative$/i.test(txt) || /^alternating$/i.test(txt)) {
    return { kind: "alternating", sourceAnnotation: txt };
  }

  const cpl = txt.match(COUNT_PER_LEG_RE);

  if (cpl) {
    return { kind: "each_leg", countPerLimb: parseInt(cpl[1]!, 10) };
  }

  const cpa = txt.match(COUNT_PER_ARM_RE);

  if (cpa) {
    return { kind: "each_arm", countPerLimb: parseInt(cpa[1]!, 10) };
  }

  if (/^(LEFT|RIGHT)\s*(ARM|arm)$/.test(txt)) {
    return {
      kind: "explicit_split",
      side: txt.toLowerCase().startsWith("left") ? "left" : "right",
    };
  }

  return null;
}
