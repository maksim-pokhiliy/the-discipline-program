import type { CanonicalDay, CanonicalSession } from "../canonical-schema";

import { LBL } from "./refs";
import { BLOCK_DROP_SET_WK2_MON, BLOCK_TEMPO_HOLDS_WK2_MON } from "./week-2-monday-strength";
import {
  BLOCK_PLACEHOLDER_BODY_WK2_MON,
  BLOCK_REP_DEFINITION_WK2_MON,
  BLOCK_WEIGHT_VARIANTS_WK2_MON,
} from "./week-2-monday-weights";

const SESSION_WK2_MON: CanonicalSession = {
  order: 1,
  label: LBL.firstSession,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [
    BLOCK_DROP_SET_WK2_MON,
    BLOCK_WEIGHT_VARIANTS_WK2_MON,
    BLOCK_PLACEHOLDER_BODY_WK2_MON,
    BLOCK_REP_DEFINITION_WK2_MON,
    BLOCK_TEMPO_HOLDS_WK2_MON,
  ],
};

export const DAY_WK2_MON: CanonicalDay = {
  dayOfWeek: "MONDAY",
  label: null,
  notes: null,
  sessions: [SESSION_WK2_MON],
};
