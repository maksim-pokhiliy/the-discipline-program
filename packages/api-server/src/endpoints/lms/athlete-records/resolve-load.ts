import { type Load } from "@repo/contracts/lms/_shared";

import { type AthleteLoadContext, type ResolvedLoad } from "./athlete-records.types";

const PER_HAND_COUNT = 2;
const PERCENT_DIVISOR = 100;
const ROUND_FACTOR = 10;

const round1 = (value: number): number => Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
type ByProfileAxis = ByProfileLoad["axes"][number];

const isAxisResolvable = (axis: ByProfileAxis, selections: Record<string, string>): boolean => {
  const picked = selections[axis.name];

  return picked !== undefined && axis.values.includes(picked);
};

const resolveCoords = (
  axes: readonly ByProfileAxis[],
  selections: Record<string, string>,
): string[] | null => {
  const coords: string[] = [];

  for (const axis of axes) {
    const picked = selections[axis.name];

    if (picked === undefined) {
      return null;
    }

    coords.push(picked);
  }

  return coords;
};

const coordsEqual = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const resolveByProfile = (load: ByProfileLoad, ctx: AthleteLoadContext): ResolvedLoad => {
  const missing = load.axes
    .filter((axis) => !isAxisResolvable(axis, ctx.profileSelections))
    .map((axis) => axis.name);

  if (missing.length > 0) {
    return {
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisNames: missing,
    };
  }

  const wantedCoords = resolveCoords(load.axes, ctx.profileSelections);
  const cell =
    wantedCoords === null ? undefined : load.cells.find((c) => coordsEqual(c.coords, wantedCoords));

  return cell === undefined
    ? {
        status: "unresolved",
        reason: "missing_profile_pick",
        prompt: "pick_profile",
        axisNames: load.axes.map((axis) => axis.name),
      }
    : { status: "resolved", kg: cell.kg, perHand: false };
};

export const resolveLoad = (
  load: Load,
  ctx: AthleteLoadContext,
  rowExerciseId: string,
): ResolvedLoad => {
  switch (load.kind) {
    case "absolute":
      return { status: "resolved", kg: load.kg, perHand: load.count === PER_HAND_COUNT };
    case "bodyweight":
      return ctx.bodyweightKg === null
        ? { status: "not_applicable" }
        : { status: "resolved", kg: ctx.bodyweightKg, perHand: false };
    case "percentage": {
      const exerciseId =
        load.reference.scope === "self" ? rowExerciseId : load.reference.targetExerciseId;
      const oneRM = ctx.currentOneRMByExercise.get(exerciseId);

      return oneRM === undefined
        ? { status: "unresolved", reason: "missing_one_rm", prompt: "set_one_rm", exerciseId }
        : {
            status: "resolved",
            kg: round1((oneRM * load.value) / PERCENT_DIVISOR),
            perHand: false,
          };
    }
    case "byProfile":
      return resolveByProfile(load, ctx);
    default:
      load satisfies never;

      return { status: "not_applicable" };
  }
};
