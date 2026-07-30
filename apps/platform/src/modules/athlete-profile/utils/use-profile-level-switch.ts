"use client";

import {
  type Gender,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import {
  buildAppliedMessage,
  buildFailedMessage,
  type LevelApplyFlight,
  type LevelApplyOutcome,
  type LevelApplyOutcomes,
  resolvePickedValue,
  useLevelApply,
} from "@app/lib/level-switch";

export type LevelSwitchFlight = {
  axisId: string;
  value: string | null;
  previousValue: string | null;
};

export type LevelSwitchOutcome = LevelApplyOutcome;

export type LevelSwitchOutcomes = LevelApplyOutcomes;

export type LevelSwitchMutate = (patch: UpdateAthleteProfileRequest) => Promise<unknown>;

export type UseProfileLevelSwitchArgs = {
  axes: ProfileAxis[];
  selections: Record<string, string>;
  gender: Gender | null;
  isPending: boolean;
  mutateAsync: LevelSwitchMutate;
};

export type ProfileLevelSwitch = {
  displaySelections: Record<string, string>;
  flight: LevelSwitchFlight | null;
  outcomes: LevelSwitchOutcomes;
  pick: (axisId: string, value: string) => void;
  clearPick: (axisId: string) => void;
  retry: (axisId: string) => void;
};

type PickMeta = {
  value: string | null;
  previousValue: string | null;
};

const withAxisValue = (
  selections: Record<string, string>,
  axisId: string,
  value: string | null,
): Record<string, string> => {
  if (value === null) {
    return Object.fromEntries(Object.entries(selections).filter(([key]) => key !== axisId));
  }

  return { ...selections, [axisId]: value };
};

const toLevelSwitchFlight = (
  flight: LevelApplyFlight<PickMeta> | null,
): LevelSwitchFlight | null =>
  flight === null
    ? null
    : { axisId: flight.scope, value: flight.meta.value, previousValue: flight.meta.previousValue };

const preFlightSelections = (
  selections: Record<string, string>,
  flight: LevelSwitchFlight | null,
): Record<string, string> => {
  if (flight === null) {
    return selections;
  }

  return withAxisValue(selections, flight.axisId, flight.previousValue);
};

const isOutcomeStale = (
  axisId: string,
  outcome: LevelSwitchOutcome,
  axes: ProfileAxis[],
  selections: Record<string, string>,
): boolean => {
  if (outcome.isApplied) {
    return false;
  }

  const axis = axes.find((candidate) => candidate.id === axisId);

  if (axis === undefined) {
    return true;
  }

  if (outcome.failedValue !== null && !axis.values.includes(outcome.failedValue)) {
    return true;
  }

  return resolvePickedValue(axis, selections) === outcome.failedValue;
};

export const useProfileLevelSwitch = ({
  axes,
  selections,
  gender,
  isPending,
  mutateAsync,
}: UseProfileLevelSwitchArgs): ProfileLevelSwitch => {
  const levelApply = useLevelApply<PickMeta>(mutateAsync);

  const flight = toLevelSwitchFlight(levelApply.flight);
  const displaySelections = preFlightSelections(selections, flight);
  const isLocked = isPending || flight !== null;

  const outcomes: LevelSwitchOutcomes = Object.fromEntries(
    Object.entries(levelApply.outcomes).filter(
      ([axisId, outcome]) => !isOutcomeStale(axisId, outcome, axes, displaySelections),
    ),
  );

  const apply = (axisId: string, value: string | null): void => {
    const nextSelections = withAxisValue(selections, axisId, value);

    void levelApply.apply({
      scope: axisId,
      meta: { value, previousValue: selections[axisId] ?? null },
      patch: { profileSelections: nextSelections },
      appliedMessage: buildAppliedMessage({ axes, selections: nextSelections, gender }),
      failedMessage: buildFailedMessage({ axes, selections, gender }),
      failedValue: value,
    });
  };

  const pick = (axisId: string, value: string): void => {
    if (isLocked || displaySelections[axisId] === value) {
      return;
    }

    apply(axisId, value);
  };

  const clearPick = (axisId: string): void => {
    if (isLocked || displaySelections[axisId] === undefined) {
      return;
    }

    apply(axisId, null);
  };

  const retry = (axisId: string): void => {
    const outcome = outcomes[axisId];

    if (isLocked || outcome === undefined || outcome.isApplied) {
      return;
    }

    apply(axisId, outcome.failedValue);
  };

  return { displaySelections, flight, outcomes, pick, clearPick, retry };
};
