import { type PlanOverride as PrismaPlanOverride } from "@prisma/client";

import {
  type PlanOverride,
  PlanOverrideKind,
  PlanOverrideScope,
  planOverridePayloadSchema,
} from "@repo/contracts/lms/plan-override";
import { InternalServerError, ValidationError } from "@repo/errors";

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

  const parsed = planOverridePayloadSchema.safeParse(o.payload);

  if (!parsed.success) {
    throw new InternalServerError("PlanOverride payload parse failure", {
      id: o.id,
      error: parsed.error.message,
    });
  }

  return {
    id: o.id,
    enrollmentId: o.enrollmentId,
    scope: o.scope,
    scopeId: o.scopeId,
    kind: o.kind,
    payload: parsed.data,
    startsOnWeekIndex: o.startsOnWeekIndex,
    endsOnWeekIndex: o.endsOnWeekIndex,
    createdAt: o.createdAt,
  };
};
