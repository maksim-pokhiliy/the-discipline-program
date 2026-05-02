import type { EffectivePlanWeek } from "@repo/contracts/lms/plan-override";
import { logger } from "@repo/shared";

import { buildNodeMap } from "./plan-override-resolver.apply-overrides";
import { buildEffectiveWeek } from "./plan-override-resolver.build-week";
import { loadEnrollmentWeek, loadOverridesForWeek } from "./plan-override-resolver.load-tree";
import { type Db } from "./plan-override-resolver.types";

export interface ResolveEffectivePlanInput {
  db: Db;
  enrollmentId: string;
  weekIndex: number;
}

export const resolveEffectivePlan = async ({
  db,
  enrollmentId,
  weekIndex,
}: ResolveEffectivePlanInput): Promise<EffectivePlanWeek> => {
  const week = await loadEnrollmentWeek(db, enrollmentId, weekIndex);
  const overrides = await loadOverridesForWeek(db, enrollmentId, weekIndex);
  const { nodeMap, counts } = buildNodeMap(overrides);
  const effectiveWeek = buildEffectiveWeek(week, nodeMap, overrides);

  logger.info("lms.plan_override.resolved", {
    enrollmentId,
    weekIndex,
    overrideCount: overrides.length,
    applied: counts,
  });

  return effectiveWeek;
};
