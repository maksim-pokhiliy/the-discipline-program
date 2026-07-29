import { Gender } from "@prisma/client";

import { GENDER_AXIS_COORDS, type Load } from "@repo/contracts/lms/_shared";

import {
  type AthleteLoadContext,
  type ResolvedLoad,
  type ResolvedLoadProfileCoord,
} from "./athlete-records.types";

const PER_HAND_COUNT = 2;
const PERCENT_DIVISOR = 100;
const ROUND_FACTOR = 10;

const GENDER_TO_COORD: Record<Gender, string> = {
  [Gender.MALE]: GENDER_AXIS_COORDS.MALE,
  [Gender.FEMALE]: GENDER_AXIS_COORDS.FEMALE,
};

const round1 = (value: number): number => Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;

type ByProfileLoad = Extract<Load, { kind: "byProfile" }>;
type ByProfileAxis = ByProfileLoad["axes"][number];

const resolveAxisCoord = (axis: ByProfileAxis, ctx: AthleteLoadContext): string | null => {
  if (axis.binding === "GENDER") {
    return ctx.gender === null ? null : GENDER_TO_COORD[ctx.gender];
  }

  const picked = ctx.profileSelections[axis.axisId];

  return picked !== undefined && axis.values.includes(picked) ? picked : null;
};

const axisLabel = (axis: ByProfileAxis): string => axis.label;

const resolveCoords = (
  axes: readonly ByProfileAxis[],
  ctx: AthleteLoadContext,
): ResolvedLoadProfileCoord[] | null => {
  const coords: ResolvedLoadProfileCoord[] = [];

  for (const axis of axes) {
    const coord = resolveAxisCoord(axis, ctx);

    if (coord === null) {
      return null;
    }

    coords.push({
      axisId: axis.axisId,
      label: axis.label,
      value: coord,
      binding: axis.binding,
    });
  }

  return coords;
};

const coordsEqual = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const plainAxisLabels = (load: ByProfileLoad): string[] =>
  load.axes.filter((axis) => axis.binding === null).map(axisLabel);

const resolveByProfile = (load: ByProfileLoad, ctx: AthleteLoadContext): ResolvedLoad => {
  const pickMissing = load.axes.filter(
    (axis) => axis.binding === null && resolveAxisCoord(axis, ctx) === null,
  );

  if (pickMissing.length > 0) {
    return {
      status: "unresolved",
      reason: "missing_profile_pick",
      prompt: "pick_profile",
      axisLabels: pickMissing.map(axisLabel),
    };
  }

  const attributeMissing = load.axes.filter(
    (axis) => axis.binding === "GENDER" && resolveAxisCoord(axis, ctx) === null,
  );

  if (attributeMissing.length > 0) {
    return {
      status: "unresolved",
      reason: "missing_profile_attribute",
      prompt: "set_profile_attribute",
      attribute: "gender",
      axisLabels: attributeMissing.map(axisLabel),
    };
  }

  const wantedCoords = resolveCoords(load.axes, ctx);

  if (wantedCoords !== null) {
    const wantedValues = wantedCoords.map((coord) => coord.value);
    const cell = load.cells.find((c) => coordsEqual(c.coords, wantedValues));

    if (cell !== undefined) {
      return {
        status: "resolved",
        kg: cell.kg,
        perHand: false,
        source: { kind: "profile", coords: wantedCoords },
      };
    }
  }

  const labels = plainAxisLabels(load);

  if (labels.length === 0) {
    return {
      status: "unresolved",
      reason: "missing_profile_attribute",
      prompt: "set_profile_attribute",
      attribute: "gender",
      axisLabels: load.axes.filter((axis) => axis.binding === "GENDER").map(axisLabel),
    };
  }

  return {
    status: "unresolved",
    reason: "missing_profile_pick",
    prompt: "pick_profile",
    axisLabels: labels,
  };
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
      return { status: "bodyweight" };
    case "percentage": {
      const exerciseId =
        load.reference.scope === "self" ? rowExerciseId : load.reference.targetExerciseId;
      const oneRM = ctx.currentOneRMByExercise.get(exerciseId);

      return oneRM === undefined
        ? { status: "unresolved", reason: "missing_one_rm", prompt: "set_one_rm", exerciseId }
        : {
            status: "resolved",
            kg: round1((oneRM.valueKg * load.value) / PERCENT_DIVISOR),
            perHand: false,
            source: {
              kind: "one_rm",
              exerciseId,
              percent: load.value,
              ...(load.rangeMax !== undefined && { percentMax: load.rangeMax }),
              baseKg: oneRM.valueKg,
              recordedAt: oneRM.recordedAt.toISOString(),
              recordSource: oneRM.source,
            },
          };
    }
    case "byProfile":
      return resolveByProfile(load, ctx);
    default:
      load satisfies never;

      return { status: "not_applicable" };
  }
};
