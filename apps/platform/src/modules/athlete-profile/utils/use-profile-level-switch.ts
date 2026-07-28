"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import {
  type Gender,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { PICK_OUTCOME_DISMISS_MS } from "./athlete-profile.constants";
import { buildAppliedMessage, buildFailedMessage } from "./profile-coordinates";

export type LevelSwitchFlight = {
  axisId: string;
  value: string | null;
  previousValue: string | null;
};

export type LevelSwitchOutcome = {
  axisId: string;
  isApplied: boolean;
  message: string;
};

export type LevelSwitchMutate = (
  patch: UpdateAthleteProfileRequest,
  options: { onSuccess: () => void; onError: () => void },
) => void;

export type UseProfileLevelSwitchArgs = {
  axes: ProfileAxis[];
  selections: Record<string, string>;
  gender: Gender | null;
  isPending: boolean;
  mutate: LevelSwitchMutate;
};

export type ProfileLevelSwitch = {
  displaySelections: Record<string, string>;
  flight: LevelSwitchFlight | null;
  outcome: LevelSwitchOutcome | null;
  pick: (axisId: string, value: string) => void;
  clearPick: (axisId: string) => void;
  retry: () => void;
  dismissOutcome: () => void;
};

type LevelSwitchAttempt = { axisId: string; value: string | null };

type ApplyContext = {
  axes: ProfileAxis[];
  gender: Gender | null;
  selections: Record<string, string>;
  mutate: LevelSwitchMutate;
  setAttempt: Dispatch<SetStateAction<LevelSwitchAttempt | null>>;
  setFlight: Dispatch<SetStateAction<LevelSwitchFlight | null>>;
  setOutcome: Dispatch<SetStateAction<LevelSwitchOutcome | null>>;
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

const preFlightSelections = (
  selections: Record<string, string>,
  flight: LevelSwitchFlight | null,
): Record<string, string> => {
  if (flight === null) {
    return selections;
  }

  return withAxisValue(selections, flight.axisId, flight.previousValue);
};

const applyPick = (context: ApplyContext, axisId: string, value: string | null): void => {
  const { axes, gender, selections, mutate, setAttempt, setFlight, setOutcome } = context;
  const applied = withAxisValue(selections, axisId, value);

  setAttempt({ axisId, value });
  setFlight({ axisId, value, previousValue: selections[axisId] ?? null });
  setOutcome(null);

  mutate(
    { profileSelections: applied },
    {
      onSuccess: () => {
        setFlight(null);
        setOutcome({
          axisId,
          isApplied: true,
          message: buildAppliedMessage({ axes, selections: applied, gender }),
        });
      },
      onError: () => {
        setFlight(null);
        setOutcome({
          axisId,
          isApplied: false,
          message: buildFailedMessage({ axes, selections, gender }),
        });
      },
    },
  );
};

const useAutoDismissApplied = (
  outcome: LevelSwitchOutcome | null,
  setOutcome: Dispatch<SetStateAction<LevelSwitchOutcome | null>>,
): void => {
  useEffect(() => {
    if (outcome === null || !outcome.isApplied) {
      return;
    }

    const timer = setTimeout(() => {
      setOutcome(null);
    }, PICK_OUTCOME_DISMISS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [outcome, setOutcome]);
};

export const useProfileLevelSwitch = ({
  axes,
  selections,
  gender,
  isPending,
  mutate,
}: UseProfileLevelSwitchArgs): ProfileLevelSwitch => {
  const [flight, setFlight] = useState<LevelSwitchFlight | null>(null);
  const [outcome, setOutcome] = useState<LevelSwitchOutcome | null>(null);
  const [attempt, setAttempt] = useState<LevelSwitchAttempt | null>(null);

  useAutoDismissApplied(outcome, setOutcome);

  const displaySelections = preFlightSelections(selections, flight);
  const isLocked = isPending || flight !== null;

  const apply = (axisId: string, value: string | null): void => {
    const context = { axes, gender, selections, mutate, setAttempt, setFlight, setOutcome };

    applyPick(context, axisId, value);
  };

  const pick = (axisId: string, value: string): void => {
    if (isLocked || displaySelections[axisId] === value) {
      return;
    }

    apply(axisId, value);
  };

  const clearPick = (axisId: string): void => {
    if (isLocked) {
      return;
    }

    apply(axisId, null);
  };

  const retry = (): void => {
    if (isLocked || attempt === null) {
      return;
    }

    apply(attempt.axisId, attempt.value);
  };

  const dismissOutcome = (): void => {
    setOutcome(null);
  };

  return { displaySelections, flight, outcome, pick, clearPick, retry, dismissOutcome };
};
