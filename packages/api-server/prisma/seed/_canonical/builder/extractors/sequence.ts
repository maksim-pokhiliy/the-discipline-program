import { type SequenceIndicator } from "@repo/contracts/lms/_shared";

const ONLY_ONCE_RE = /^ONLY\s+ONCE\s+before\s+(.+)$/i;
const BEFORE_AND_AFTER_RE = /^after\s+(.+?)\s+(?:complex\s+)?and\s+before\s+(.+?)(?:\s+block)?$/i;
const BEFORE_RE = /^before\s+(.+?)(?:\s+complex)?$/i;
const AFTER_RE = /^after\s+(.+?)(?:\s+complex)?$/i;
const AFTER_EACH_ROUND_RE = /^AFTER\s+EACH\s+ROUND$/i;
const AFTER_EACH_TYPED_ROUND_RE = /^after\s+each\s+([A-Z][A-Za-z]+)\s+round$/;

export function tryParseSequence(inner: string): SequenceIndicator | null {
  const txt = inner.trim();
  const oo = txt.match(ONLY_ONCE_RE);

  if (oo) {
    return { kind: "only_once_before", targetLabel: oo[1]!.trim() };
  }

  if (AFTER_EACH_ROUND_RE.test(txt)) {
    return { kind: "after_each_round" };
  }

  const typed = txt.match(AFTER_EACH_TYPED_ROUND_RE);

  if (typed) {
    return { kind: "after_each_typed_round", type: typed[1]! };
  }

  const both = txt.match(BEFORE_AND_AFTER_RE);

  if (both) {
    return {
      kind: "before_named_after_named_composite",
      afterLabel: both[1]!.trim(),
      beforeLabel: both[2]!.trim(),
    };
  }

  const after = txt.match(AFTER_RE);

  if (after) {
    return { kind: "after_named", targetLabel: after[1]!.trim() };
  }

  const before = txt.match(BEFORE_RE);

  if (before) {
    return { kind: "before_named", targetLabel: before[1]!.trim() };
  }

  return null;
}
