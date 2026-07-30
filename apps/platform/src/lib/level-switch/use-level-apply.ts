"use client";

import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

import { type UpdateAthleteProfileRequest } from "@repo/contracts/coaching/athlete-profile";

import { PICK_OFFLINE_REPEAT, PICK_OUTCOME_DISMISS_MS } from "./level-switch.constants";

export type LevelApplyOutcome =
  | { isApplied: true; message: string }
  | { isApplied: false; failedValue: string | null; isOffline: boolean; message: string };

export type LevelApplyOutcomes = Record<string, LevelApplyOutcome>;

export type LevelApplyFlight<TMeta> = {
  scope: string;
  meta: TMeta;
};

export type LevelApplyMutate = (patch: UpdateAthleteProfileRequest) => Promise<unknown>;

export type LevelApplyRequest<TMeta> = {
  scope: string;
  meta: TMeta;
  patch: UpdateAthleteProfileRequest;
  appliedMessage: string;
  failedMessage: string;
  failedValue: string | null;
};

export type LevelApply<TMeta> = {
  flight: LevelApplyFlight<TMeta> | null;
  outcomes: LevelApplyOutcomes;
  apply: (request: LevelApplyRequest<TMeta>) => Promise<boolean>;
  dismiss: (scope: string) => void;
};

const isBrowserOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;

const withoutKey = <T>(source: Record<string, T>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(source).filter(([candidate]) => candidate !== key));

const isOfflineRepeat = (previous: LevelApplyOutcome | undefined): boolean =>
  previous !== undefined && !previous.isApplied && previous.isOffline;

const useAutoDismissApplied = (
  results: LevelApplyOutcomes,
  setResults: Dispatch<SetStateAction<LevelApplyOutcomes>>,
): void => {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const scheduled = timers.current;

    for (const scope of [...scheduled.keys()]) {
      if (results[scope]?.isApplied === true) {
        continue;
      }

      clearTimeout(scheduled.get(scope));
      scheduled.delete(scope);
    }

    for (const [scope, outcome] of Object.entries(results)) {
      if (!outcome.isApplied || scheduled.has(scope)) {
        continue;
      }

      scheduled.set(
        scope,
        setTimeout(() => {
          scheduled.delete(scope);
          setResults((current) =>
            current[scope]?.isApplied === true ? withoutKey(current, scope) : current,
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

export const useLevelApply = <TMeta>(mutateAsync: LevelApplyMutate): LevelApply<TMeta> => {
  const [flight, setFlight] = useState<LevelApplyFlight<TMeta> | null>(null);
  const [outcomes, setOutcomes] = useState<LevelApplyOutcomes>({});

  useAutoDismissApplied(outcomes, setOutcomes);

  const apply = async ({
    scope,
    meta,
    patch,
    appliedMessage,
    failedMessage,
    failedValue,
  }: LevelApplyRequest<TMeta>): Promise<boolean> => {
    if (isBrowserOffline()) {
      setOutcomes((current) => ({
        ...current,
        [scope]: {
          isApplied: false,
          failedValue,
          isOffline: true,
          message: isOfflineRepeat(current[scope]) ? PICK_OFFLINE_REPEAT : failedMessage,
        },
      }));

      return false;
    }

    setOutcomes((current) => withoutKey(current, scope));
    setFlight({ scope, meta });

    try {
      await mutateAsync(patch);
      setOutcomes((current) => ({
        ...current,
        [scope]: { isApplied: true, message: appliedMessage },
      }));

      return true;
    } catch {
      setOutcomes((current) => ({
        ...current,
        [scope]: { isApplied: false, failedValue, isOffline: false, message: failedMessage },
      }));

      return false;
    } finally {
      setFlight(null);
    }
  };

  const dismiss = (scope: string): void => {
    setOutcomes((current) => withoutKey(current, scope));
  };

  return { flight, outcomes, apply, dismiss };
};
