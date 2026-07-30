import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type UpdateAthleteProfileRequest } from "@repo/contracts/coaching/athlete-profile";

import { PICK_OFFLINE_REPEAT, PICK_OUTCOME_DISMISS_MS } from "./level-switch.constants";
import { type LevelApplyFlight, type LevelApplyRequest, useLevelApply } from "./use-level-apply";

type PickMeta = { value: string | null };

const SCOPE = "clz00000000000000000axs01";
const APPLIED_MESSAGE = "Applied — training weights everywhere now resolve as RX.";
const FAILED_MESSAGE = "Couldn't apply. Your level is still SC.";

const mutateAsync = vi.fn<(patch: UpdateAthleteProfileRequest) => Promise<unknown>>();

const setOnline = (isOnline: boolean): void => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(isOnline);
};

const request = (
  overrides: Partial<LevelApplyRequest<PickMeta>> = {},
): LevelApplyRequest<PickMeta> => ({
  scope: SCOPE,
  meta: { value: "RX" },
  patch: { profileSelections: { [SCOPE]: "RX" } },
  appliedMessage: APPLIED_MESSAGE,
  failedMessage: FAILED_MESSAGE,
  failedValue: "RX",
  ...overrides,
});

const renderApply = () => renderHook(() => useLevelApply<PickMeta>(mutateAsync));

beforeEach(() => {
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue(undefined);
  setOnline(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLevelApply offline gate", () => {
  it("refuses an offline apply without ever putting a flight on the wire", async () => {
    setOnline(false);

    const seenFlights: (LevelApplyFlight<PickMeta> | null)[] = [];

    const { result } = renderHook(() => {
      const levelApply = useLevelApply<PickMeta>(mutateAsync);

      seenFlights.push(levelApply.flight);

      return levelApply;
    });

    await act(async () => {
      await result.current.apply(request());
    });

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(seenFlights.every((flight) => flight === null)).toBe(true);
    expect(result.current.outcomes[SCOPE]).toEqual({
      isApplied: false,
      failedValue: "RX",
      isOffline: true,
      message: FAILED_MESSAGE,
    });
  });

  it("swaps to the repeat copy when the second attempt is refused too", async () => {
    setOnline(false);

    const { result } = renderApply();

    await act(async () => {
      await result.current.apply(request());
    });

    expect(result.current.outcomes[SCOPE]?.message).toBe(FAILED_MESSAGE);

    await act(async () => {
      await result.current.apply(request());
    });

    expect(result.current.outcomes[SCOPE]?.message).toBe(PICK_OFFLINE_REPEAT);
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});

describe("useLevelApply flight", () => {
  it("holds the flight across the write and reports the applied outcome", async () => {
    let settle = (): void => undefined;

    mutateAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );

    const { result } = renderApply();

    let isApplied = false;

    act(() => {
      void result.current.apply(request()).then((outcome) => {
        isApplied = outcome;
      });
    });

    expect(result.current.flight).toEqual({ scope: SCOPE, meta: { value: "RX" } });
    expect(mutateAsync).toHaveBeenCalledWith({ profileSelections: { [SCOPE]: "RX" } });

    await act(async () => {
      settle();
    });

    expect(isApplied).toBe(true);
    expect(result.current.flight).toBeNull();
    expect(result.current.outcomes[SCOPE]).toEqual({
      isApplied: true,
      message: APPLIED_MESSAGE,
    });
  });

  it("records the value it tried to write when the mutation rejects", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"));

    const { result } = renderApply();

    let isApplied = true;

    await act(async () => {
      isApplied = await result.current.apply(request());
    });

    expect(isApplied).toBe(false);
    expect(result.current.flight).toBeNull();
    expect(result.current.outcomes[SCOPE]).toEqual({
      isApplied: false,
      failedValue: "RX",
      isOffline: false,
      message: FAILED_MESSAGE,
    });
  });
});

describe("useLevelApply outcome lifetime", () => {
  it("dismisses an applied outcome once the ratified delay elapses", async () => {
    vi.useFakeTimers();

    try {
      const { result } = renderApply();

      await act(async () => {
        await result.current.apply(request());
      });

      expect(result.current.outcomes[SCOPE]?.isApplied).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PICK_OUTCOME_DISMISS_MS);
      });

      expect(result.current.outcomes[SCOPE]).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the pending dismiss timer when the caller unmounts", async () => {
    vi.useFakeTimers();

    try {
      const { result, unmount } = renderApply();

      await act(async () => {
        await result.current.apply(request());
      });

      expect(vi.getTimerCount()).toBe(1);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops an outcome on demand", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"));

    const { result } = renderApply();

    await act(async () => {
      await result.current.apply(request());
    });

    expect(result.current.outcomes[SCOPE]).toBeDefined();

    act(() => {
      result.current.dismiss(SCOPE);
    });

    expect(result.current.outcomes[SCOPE]).toBeUndefined();
  });
});
