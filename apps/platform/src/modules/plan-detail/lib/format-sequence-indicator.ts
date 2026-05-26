import { type SequenceIndicator } from "@repo/contracts/lms/_shared";

const BEFORE_PREFIX = "before ";
const AFTER_PREFIX = "after ";
const BETWEEN_PREFIX = "between ";
const AMPERSAND_INFIX = " & ";
const ONCE_BEFORE_PREFIX = "once before ";
const AFTER_EACH_ROUND = "after each round";
const AFTER_EACH_PREFIX = "after each ";
const ROUND_SUFFIX = " round";

export const formatSequenceIndicator = (sequence: SequenceIndicator): string => {
  switch (sequence.kind) {
    case "before_named":
      return `${BEFORE_PREFIX}${sequence.targetLabel}`;
    case "after_named":
      return `${AFTER_PREFIX}${sequence.targetLabel}`;
    case "before_named_after_named_composite":
      return `${BETWEEN_PREFIX}${sequence.beforeLabel}${AMPERSAND_INFIX}${sequence.afterLabel}`;
    case "only_once_before":
      return `${ONCE_BEFORE_PREFIX}${sequence.targetLabel}`;
    case "after_each_round":
      return AFTER_EACH_ROUND;
    case "after_each_typed_round":
      return `${AFTER_EACH_PREFIX}${sequence.type}${ROUND_SUFFIX}`;
    default:
      sequence satisfies never;

      return "";
  }
};
