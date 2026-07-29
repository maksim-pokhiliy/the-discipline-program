"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import {
  type Gender,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { PICK_OUTCOME_DISMISS_MS } from "./athlete-profile.constants";
import { buildAppliedMessage, buildFailedMessage, resolvePickedValue } from "./profile-coordinates";

export type LevelSwitchFlight = {
  axisId: string;
  value: string | null;
  previousValue: string | null;
};

type LevelSwitchResult =
  | { axisId: string; isApplied: true }
  | { axisId: string; isApplied: false; failedValue: string | null };

export type LevelSwitchOutcome = LevelSwitchResult & { message: string };

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
  outcome: LevelSwitchOutcome | null;
  pick: (axisId: string, value: string) => void;
  clearPick: (axisId: string) => void;
  retry: () => void;
};

type ApplyContext = {
  selections: Record<string, string>;
  mutateAsync: LevelSwitchMutate;
  setFlight: Dispatch<SetStateAction<LevelSwitchFlight | null>>;
  setResult: Dispatch<SetStateAction<LevelSwitchResult | null>>;
};

const isBrowserOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

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

const preFlightSelections = (
  selections: Record<string, string>,
  flight: LevelSwitchFlight | null,
): Record<string, string> => {
  if (flight === null) {
    return selections;
  }

  return withAxisValue(selections, flight.axisId, flight.previousValue);
};

const applyPick = async (
  context: ApplyContext,
  axisId: string,
  value: string | null,
): Promise<void> => {
  const { selections, mutateAsync, setFlight, setResult } = context;

  setResult(null);

  if (isBrowserOffline()) {
    setResult({ axisId, isApplied: false, failedValue: value });

    return;
  }

  setFlight({ axisId, value, previousValue: selections[axisId] ?? null });

  try {
    await mutateAsync({ profileSelections: withAxisValue(selections, axisId, value) });
    setResult({ axisId, isApplied: true });
  } catch {
    setResult({ axisId, isApplied: false, failedValue: value });
  } finally {
    setFlight(null);
  }
};

const isResultStale = (
  result: LevelSwitchResult,
  axes: ProfileAxis[],
  selections: Record<string, string>,
): boolean => {
  if (result.isApplied) {
    return false;
  }

  const axis = axes.find((candidate) => candidate.id === result.axisId);

  if (axis === undefined) {
    return true;
  }

  if (result.failedValue !== null && !axis.values.includes(result.failedValue)) {
    return true;
  }

  return resolvePickedValue(axis, selections) === result.failedValue;
};

const useAutoDismissApplied = (
  result: LevelSwitchResult | null,
  setResult: Dispatch<SetStateAction<LevelSwitchResult | null>>,
): void => {
  useEffect(() => {
    if (result === null || !result.isApplied) {
      return;
    }

    const timer = setTimeout(() => {
      setResult(null);
    }, PICK_OUTCOME_DISMISS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [result, setResult]);
};

export const useProfileLevelSwitch = ({
  axes,
  selections,
  gender,
  isPending,
  mutateAsync,
}: UseProfileLevelSwitchArgs): ProfileLevelSwitch => {
  const [flight, setFlight] = useState<LevelSwitchFlight | null>(null);
  const [result, setResult] = useState<LevelSwitchResult | null>(null);

  useAutoDismissApplied(result, setResult);

  const displaySelections = preFlightSelections(selections, flight);
  const isLocked = isPending || flight !== null;

  const coordinates = { axes, selections: displaySelections, gender };
  const outcome =
    result === null || isResultStale(result, axes, displaySelections)
      ? null
      : {
          ...result,
          message: result.isApplied
            ? buildAppliedMessage(coordinates)
            : buildFailedMessage(coordinates),
        };

  const apply = (axisId: string, value: string | null): void => {
    void applyPick({ selections, mutateAsync, setFlight, setResult }, axisId, value);
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

  const retry = (): void => {
    if (isLocked || outcome === null || outcome.isApplied) {
      return;
    }

    apply(outcome.axisId, outcome.failedValue);
  };

  return { displaySelections, flight, outcome, pick, clearPick, retry };
};
