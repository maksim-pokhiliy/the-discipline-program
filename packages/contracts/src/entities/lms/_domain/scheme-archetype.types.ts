import { type z } from "zod";

import {
  type schemeArchetypeKindSchema,
  type schemeParamsCountDownSchema,
  type schemeParamsCountUpSchema,
  type schemeParamsDistanceSchema,
  type schemeParamsEmomLoopSchema,
  type schemeParamsIntervalLoopSchema,
  type schemeParamsLadderSchema,
  type schemeParamsNoneSchema,
  type schemeParamsSchema,
  type schemeParamsSetsRepsSchema,
  type schemeParamsTimeBoxedSchema,
} from "./scheme-archetype.schema";

export type SchemeArchetypeKind = z.infer<typeof schemeArchetypeKindSchema>;

export type SchemeParams = z.infer<typeof schemeParamsSchema>;

export type SchemeParamsNone = z.infer<typeof schemeParamsNoneSchema>;
export type SchemeParamsSetsReps = z.infer<typeof schemeParamsSetsRepsSchema>;
export type SchemeParamsCountUp = z.infer<typeof schemeParamsCountUpSchema>;
export type SchemeParamsCountDown = z.infer<typeof schemeParamsCountDownSchema>;
export type SchemeParamsIntervalLoop = z.infer<typeof schemeParamsIntervalLoopSchema>;
export type SchemeParamsEmomLoop = z.infer<typeof schemeParamsEmomLoopSchema>;
export type SchemeParamsTimeBoxed = z.infer<typeof schemeParamsTimeBoxedSchema>;
export type SchemeParamsLadder = z.infer<typeof schemeParamsLadderSchema>;
export type SchemeParamsDistance = z.infer<typeof schemeParamsDistanceSchema>;

export type DistanceUnit = SchemeParamsDistance["unit"];
export type IntervalSlotAction = SchemeParamsIntervalLoop["slots"][number]["action"];
export type EmomSlotActionKind = SchemeParamsEmomLoop["slots"][number]["action"]["kind"];
export type LadderDirection = SchemeParamsLadder["direction"];
