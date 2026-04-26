import { z } from "zod";

import { PlanOverrideKind, PlanOverrideScope } from "./plan-override.constants";

export const planOverrideScopeSchema = z.nativeEnum(PlanOverrideScope);
export const planOverrideKindSchema = z.nativeEnum(PlanOverrideKind);

export const planOverrideSchema = z.object({
  id: z.string().cuid(),
  enrollmentId: z.string().cuid(),
  scope: planOverrideScopeSchema,
  scopeId: z.string().cuid(),
  kind: planOverrideKindSchema,
  payload: z.unknown(),
  startsOnWeekIndex: z.number().int().nonnegative().nullable(),
  endsOnWeekIndex: z.number().int().nonnegative().nullable(),
  createdAt: z.date(),
});
