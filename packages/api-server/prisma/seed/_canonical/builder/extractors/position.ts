import { type Position } from "@repo/contracts/lms/schema-row";

/** Map bracket inner → Position enum, or null if not a position annotation. */
export function tryParsePosition(inner: string): Position | null {
  const txt = inner.trim().toLowerCase();

  if (txt === "neutral grip") {
    return "NEUTRAL_GRIP";
  }

  if (txt === "from sofa") {
    return "FROM_SOFA";
  }

  if (txt === "from box") {
    return "FROM_BOX";
  }

  if (txt === "from box/sofa") {
    return "FROM_BOX_OR_SOFA";
  }

  if (txt === "from sofa/box") {
    return "FROM_SOFA_BOX";
  }

  if (txt === "without bench") {
    return "WITHOUT_BENCH";
  }

  if (txt === "without jump") {
    return "WITHOUT_JUMP";
  }

  if (txt === "hold farm carry") {
    return "HOLD_FARM_CARRY";
  }

  if (txt === "hand on db") {
    return "HAND_ON_DB";
  }

  if (txt === "hands on db") {
    return "HANDS_ON_DB";
  }

  if (txt === "hand on db | neutral grip") {
    return "HAND_ON_DB_NEUTRAL_GRIP";
  }

  return null;
}
