import { type PerLimbDistribution } from "../_shared";

const EACH_LEG_LABEL = "each leg";
const EACH_ARM_LABEL = "each arm";
const SPACE = " ";
const LEFT_LABEL = "L";
const RIGHT_LABEL = "R";
const ALTERNATING_BASE = "alternating";
const ANNOTATION_OPEN = " (";
const ANNOTATION_CLOSE = ")";

export const formatSide = (side: PerLimbDistribution): string => {
  switch (side.kind) {
    case "each_leg":
      return side.countPerLimb !== undefined
        ? `${side.countPerLimb}${SPACE}${EACH_LEG_LABEL}`
        : EACH_LEG_LABEL;
    case "each_arm":
      return side.countPerLimb !== undefined
        ? `${side.countPerLimb}${SPACE}${EACH_ARM_LABEL}`
        : EACH_ARM_LABEL;
    case "explicit_split":
      return side.side === "left" ? LEFT_LABEL : RIGHT_LABEL;
    case "alternating": {
      if (side.sourceAnnotation === undefined) {
        return ALTERNATING_BASE;
      }

      return `${ALTERNATING_BASE}${ANNOTATION_OPEN}${side.sourceAnnotation}${ANNOTATION_CLOSE}`;
    }
    default:
      side satisfies never;

      return "";
  }
};
