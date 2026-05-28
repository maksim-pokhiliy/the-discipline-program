import { phase7Session } from "../builder";
import type { Phase7Session } from "../builder";

import {
  BLOCK_HR_Z2_RUN,
  BLOCK_NUMERIC_PACE_ROW,
  BLOCK_PULL_UP_CLUSTER,
  BLOCK_SNATCH_WAVE,
  BLOCK_SUPER_SET_PAIR_A,
  BLOCK_SUPER_SET_PAIR_B,
  BLOCK_TEMPO_BACK_SQUAT,
} from "./phase-7-blocks";
import { LBL } from "./refs";

export const PHASE_7_HR_Z2_BASE_RUN: Phase7Session = phase7Session({
  exampleId: "phase-7-hr-z2-base-run",
  dayOfWeek: "MONDAY",
  order: 1,
  label: LBL.endurance,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_HR_Z2_RUN],
});

export const PHASE_7_NUMERIC_PACE_ROW: Phase7Session = phase7Session({
  exampleId: "phase-7-numeric-pace-row-intervals",
  dayOfWeek: "TUESDAY",
  order: 1,
  label: LBL.conditioning,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_NUMERIC_PACE_ROW],
});

export const PHASE_7_TEMPO_BACK_SQUAT: Phase7Session = phase7Session({
  exampleId: "phase-7-tempo-back-squat",
  dayOfWeek: "WEDNESDAY",
  order: 1,
  label: LBL.strength,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_TEMPO_BACK_SQUAT],
});

export const PHASE_7_SNATCH_WAVE: Phase7Session = phase7Session({
  exampleId: "phase-7-snatch-wave",
  dayOfWeek: "FRIDAY",
  order: 1,
  label: LBL.olympic,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_SNATCH_WAVE],
});

export const PHASE_7_PULL_UP_CLUSTER: Phase7Session = phase7Session({
  exampleId: "phase-7-strict-pull-up-cluster",
  dayOfWeek: "SATURDAY",
  order: 1,
  label: LBL.gymnastics,
  notes: null,
  freezeLoadsAtCreation: true,
  blocks: [BLOCK_PULL_UP_CLUSTER],
});

export const PHASE_7_ACCESSORY_SUPER_SET: Phase7Session = phase7Session({
  exampleId: "phase-7-accessory-super-set",
  dayOfWeek: "THURSDAY",
  order: 1,
  label: LBL.accessory,
  notes: null,
  freezeLoadsAtCreation: false,
  blocks: [BLOCK_SUPER_SET_PAIR_A, BLOCK_SUPER_SET_PAIR_B],
});

export const PHASE_7_EXAMPLES: Phase7Session[] = [
  PHASE_7_HR_Z2_BASE_RUN,
  PHASE_7_NUMERIC_PACE_ROW,
  PHASE_7_TEMPO_BACK_SQUAT,
  PHASE_7_SNATCH_WAVE,
  PHASE_7_PULL_UP_CLUSTER,
  PHASE_7_ACCESSORY_SUPER_SET,
];
