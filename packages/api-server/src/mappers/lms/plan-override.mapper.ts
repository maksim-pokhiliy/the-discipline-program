import { type PlanOverride as PrismaPlanOverride } from "@prisma/client";

import {
  type PlanOverride,
  PlanOverrideKind,
  PlanOverrideScope,
} from "@repo/contracts/lms/plan-override";
import { ValidationError } from "@repo/errors";

const isPlanOverrideScope = (value: string): value is PlanOverrideScope =>
  (Object.values(PlanOverrideScope) as string[]).includes(value);

const isPlanOverrideKind = (value: string): value is PlanOverrideKind =>
  (Object.values(PlanOverrideKind) as string[]).includes(value);

export const mapToPlanOverride = (o: PrismaPlanOverride): PlanOverride => {
  if (!isPlanOverrideScope(o.scope)) {
    throw new ValidationError("Invalid PlanOverride.scope value", {
      overrideId: o.id,
      scope: o.scope,
    });
  }

  if (!isPlanOverrideKind(o.kind)) {
    throw new ValidationError("Invalid PlanOverride.kind value", {
      overrideId: o.id,
      kind: o.kind,
    });
  }

  return {
    id: o.id,
    enrollmentId: o.enrollmentId,
    scope: o.scope,
    scopeId: o.scopeId,
    kind: o.kind,
    payload: o.payload,
    startsOnWeekIndex: o.startsOnWeekIndex,
    endsOnWeekIndex: o.endsOnWeekIndex,
    createdAt: o.createdAt,
  };
};
