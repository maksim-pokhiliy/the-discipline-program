"use client";

import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

import {
  type Gender,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { PICK_OFFLINE_REPEAT, PICK_OUTCOME_DISMISS_MS } from "./athlete-profile.constants";
import { buildAppliedMessage, buildFailedMessage, resolvePickedValue } from "./profile-coordinates";

export type LevelSwitchFlight = {
  axisId: string;
  value: string | null;
  previousValue: string | null;
};

export type LevelSwitchOutcome =
  | { isApplied: true; message: string }
  | { isApplied: false; failedValue: string | null; isOffline: boolean; message: string };

export type LevelSwitchOutcomes = Record<string, LevelSwitchOutcome>;

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

type ApplyContext = {
  axes: ProfileAxis[];
  selections: Record<string, string>;
  gender: Gender | null;
  mutateAsync: LevelSwitchMutate;
  setFlight: Dispatch<SetStateAction<LevelSwitchFlight | null>>;
  setOutcomes: Dispatch<SetStateAction<LevelSwitchOutcomes>>;
};

const isBrowserOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

const withoutKey = <T>(source: Record<string, T>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(source).filter(([candidate]) => candidate !== key));

const withAxisValue = (
  selections: Record<string, string>,
  axisId: string,
  value: string | null,
): Record<string, string> => {
  if (value === null) {
    return withoutKey(selections, axisId);
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

const isOfflineRepeat = (previous: LevelSwitchOutcome | undefined): boolean =>
  previous !== undefined && !previous.isApplied && previous.isOffline;

const applyPick = async (
  context: ApplyContext,
  axisId: string,
  value: string | null,
): Promise<void> => {
  const { axes, selections, gender, mutateAsync, setFlight, setOutcomes } = context;
  const nextSelections = withAxisValue(selections, axisId, value);
  const appliedMessage = buildAppliedMessage({ axes, selections: nextSelections, gender });
  const failedMessage = buildFailedMessage({ axes, selections, gender });

  if (isBrowserOffline()) {
    setOutcomes((current) => ({
      ...current,
      [axisId]: {
        isApplied: false,
        failedValue: value,
        isOffline: true,
        message: isOfflineRepeat(current[axisId]) ? PICK_OFFLINE_REPEAT : failedMessage,
      },
    }));

    return;
  }

  setOutcomes((current) => withoutKey(current, axisId));
  setFlight({ axisId, value, previousValue: selections[axisId] ?? null });

  try {
    await mutateAsync({ profileSelections: nextSelections });
    setOutcomes((current) => ({
      ...current,
      [axisId]: { isApplied: true, message: appliedMessage },
    }));
  } catch {
    setOutcomes((current) => ({
      ...current,
      [axisId]: { isApplied: false, failedValue: value, isOffline: false, message: failedMessage },
    }));
  } finally {
    setFlight(null);
  }
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

const useAutoDismissApplied = (
  results: LevelSwitchOutcomes,
  setResults: Dispatch<SetStateAction<LevelSwitchOutcomes>>,
): void => {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const scheduled = timers.current;

    for (const axisId of [...scheduled.keys()]) {
      if (results[axisId]?.isApplied === true) {
        continue;
      }

      clearTimeout(scheduled.get(axisId));
      scheduled.delete(axisId);
    }

    for (const [axisId, outcome] of Object.entries(results)) {
      if (!outcome.isApplied || scheduled.has(axisId)) {
        continue;
      }

      scheduled.set(
        axisId,
        setTimeout(() => {
          scheduled.delete(axisId);
          setResults((current) =>
            current[axisId]?.isApplied === true ? withoutKey(current, axisId) : current,
          );
        }, PICK_OUTCOME_DISMISS_MS),
      );
    }
  }, [results, setResults]);

  useEffect(() => {
    const scheduled = timers.current;

    return () => {
      for (const timer of scheduled.values()) {
        clearTimeout(timer);
      }

      scheduled.clear();
    };
  }, []);
};

export const useProfileLevelSwitch = ({
  axes,
  selections,
  gender,
  isPending,
  mutateAsync,
}: UseProfileLevelSwitchArgs): ProfileLevelSwitch => {
  const [flight, setFlight] = useState<LevelSwitchFlight | null>(null);
  const [results, setResults] = useState<LevelSwitchOutcomes>({});

  useAutoDismissApplied(results, setResults);

  const displaySelections = preFlightSelections(selections, flight);
  const isLocked = isPending || flight !== null;

  const outcomes: LevelSwitchOutcomes = Object.fromEntries(
    Object.entries(results).filter(
      ([axisId, outcome]) => !isOutcomeStale(axisId, outcome, axes, displaySelections),
    ),
  );

  const apply = (axisId: string, value: string | null): void => {
    void applyPick(
      { axes, selections, gender, mutateAsync, setFlight, setOutcomes: setResults },
      axisId,
      value,
    );
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
