import { modifier } from "../builder";
import type { ModifierCatalogEntry } from "../canonical-schema";

import { MOD } from "./refs";

export const DEMO_MODIFIERS: ModifierCatalogEntry[] = [
  modifier({ ref: MOD.handsOnDB, name: "hands on DB", notes: null }),
  modifier({ ref: MOD.neutralGrip, name: "neutral grip", notes: null }),
  modifier({ ref: MOD.withoutBench, name: "without bench", notes: null }),
  modifier({ ref: MOD.fromBox, name: "from box", notes: null }),
  modifier({ ref: MOD.fromBoxOrSofa, name: "from box / sofa", notes: null }),
  modifier({ ref: MOD.fromSofa, name: "from sofa", notes: null }),
  modifier({ ref: MOD.withoutJump, name: "without jump", notes: null }),
  modifier({ ref: MOD.holdFarmerCarry, name: "hold farmer carry", notes: null }),
  modifier({ ref: MOD.leftArmWorking, name: "left arm working", notes: null }),
  modifier({ ref: MOD.passiveHoldInUp, name: "passive arm hold in up", notes: null }),
  modifier({ ref: MOD.toParallel, name: "to parallel", notes: null }),
  modifier({ ref: MOD.slowEccentric4s, name: "slow eccentric 4s", notes: null }),
  modifier({ ref: MOD.pauseInUp2s, name: "2 sec pause in up", notes: null }),
  modifier({ ref: MOD.holdAfterLast10s, name: "10 sec hold after last", notes: null }),
  modifier({ ref: MOD.pauseEvery3Reps, name: "pause every 3 reps", notes: null }),
];
