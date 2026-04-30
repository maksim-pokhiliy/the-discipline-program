import { z } from "zod";

import { type EditingTarget } from "./types";

const ATHLETE_PREFIX = "athlete:";
const cuidSchema = z.string().cuid();

export const ALL_TARGET: EditingTarget = { kind: "all" };

export const parseEditingTarget = (raw: string | null): EditingTarget => {
  if (!raw) {
    return ALL_TARGET;
  }

  if (!raw.startsWith(ATHLETE_PREFIX)) {
    return ALL_TARGET;
  }

  const candidate = raw.slice(ATHLETE_PREFIX.length);
  const parseResult = cuidSchema.safeParse(candidate);

  if (!parseResult.success) {
    return ALL_TARGET;
  }

  return { kind: "athlete", enrollmentId: parseResult.data };
};

export const formatEditingTarget = (target: EditingTarget): string | null => {
  if (target.kind === "all") {
    return null;
  }

  return `${ATHLETE_PREFIX}${target.enrollmentId}`;
};

export const editingTargetEquals = (left: EditingTarget, right: EditingTarget): boolean => {
  if (left.kind === "all" && right.kind === "all") {
    return true;
  }

  if (left.kind === "athlete" && right.kind === "athlete") {
    return left.enrollmentId === right.enrollmentId;
  }

  return false;
};
