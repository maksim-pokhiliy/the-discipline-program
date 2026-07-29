import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gender, type UpdateAthleteProfileRequest } from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { PICK_OFFLINE_REPEAT } from "./athlete-profile.constants";
import { useProfileLevelSwitch, type UseProfileLevelSwitchArgs } from "./use-profile-level-switch";

const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const NOW = new Date("2026-06-16T09:00:00.000Z");

const plainAxis = (id: string, label: string, values: string[]): ProfileAxis => ({
  id,
  key: label.toLowerCase(),
  label,
  values,
  binding: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const LEVEL_AXIS = plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]);
const AXES = [LEVEL_AXIS, plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"])];

const mutateAsync = vi.fn<(patch: UpdateAthleteProfileRequest) => Promise<unknown>>();

const setOnline = (isOnline: boolean): void => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(isOnline);
};

const props = (overrides: Partial<UseProfileLevelSwitchArgs> = {}): UseProfileLevelSwitchArgs => ({
  axes: AXES,
  selections: {},
  gender: Gender.FEMALE,
  isPending: false,
  mutateAsync,
  ...overrides,
});

const renderSwitch = (overrides: Partial<UseProfileLevelSwitchArgs> = {}) =>
  renderHook((next: UseProfileLevelSwitchArgs) => useProfileLevelSwitch(next), {
    initialProps: props(overrides),
  });

beforeEach(() => {
  mutateAsync.mockReset();
  mutateAsync.mockResolvedValue(undefined);
  setOnline(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useProfileLevelSwitch guards", () => {
  it("ignores a pick of the value that is already current", () => {
    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "RX" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("ignores a clear on an axis that has no pick", () => {
    const { result } = renderSwitch();

    act(() => {
      result.current.clearPick(LEVEL_AXIS_ID);
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("ignores a pick while another profile write is pending", () => {
    const { result } = renderSwitch({ isPending: true });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});

describe("useProfileLevelSwitch flight", () => {
  it("shows the previous pick as current until the write settles", async () => {
    let settle = (): void => undefined;

    mutateAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );

    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    expect(result.current.flight).toEqual({
      axisId: LEVEL_AXIS_ID,
      value: "RX",
      previousValue: "SC",
    });
    expect(result.current.displaySelections[LEVEL_AXIS_ID]).toBe("SC");

    await act(async () => {
      settle();
    });

    expect(result.current.flight).toBeNull();
  });

  it("reports a failure without calling the server when the browser is offline", async () => {
    setOnline(false);

    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    });

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(result.current.flight).toBeNull();
    expect(result.current.outcomes[LEVEL_AXIS_ID]?.message).toBe(
      "Couldn't apply. Your level is still SC · Female. Scale still not picked.",
    );
  });

  it("changes the wording on a repeat offline refusal so the retry is visible", async () => {
    setOnline(false);

    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]).toBeDefined();
    });

    const firstMessage = result.current.outcomes[LEVEL_AXIS_ID]?.message;

    act(() => {
      result.current.retry(LEVEL_AXIS_ID);
    });

    const repeatMessage = result.current.outcomes[LEVEL_AXIS_ID]?.message;

    expect(repeatMessage).toBe(PICK_OFFLINE_REPEAT);
    expect(repeatMessage).not.toBe(firstMessage);
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});

describe("useProfileLevelSwitch retry", () => {
  it("does nothing once the outcome is a success", async () => {
    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(true);
    });

    act(() => {
      result.current.retry(LEVEL_AXIS_ID);
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("replays the failed value onto the selections as they stand now", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"));

    const { result, rerender } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    });

    rerender(props({ selections: { [LEVEL_AXIS_ID]: "SC", [SCALE_AXIS_ID]: "M" } }));

    act(() => {
      result.current.retry(LEVEL_AXIS_ID);
    });

    expect(mutateAsync).toHaveBeenLastCalledWith({
      profileSelections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
    });
  });
});

describe("useProfileLevelSwitch per-axis outcome slots", () => {
  it("keeps one axis failure alive while a neighbouring axis is mid-flight", async () => {
    let settle = (): void => undefined;

    mutateAsync.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    });

    mutateAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );

    act(() => {
      result.current.pick(SCALE_AXIS_ID, "M");
    });

    expect(result.current.flight?.axisId).toBe(SCALE_AXIS_ID);
    expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    expect(result.current.outcomes[SCALE_AXIS_ID]).toBeUndefined();

    await act(async () => {
      settle();
    });

    expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    expect(result.current.outcomes[SCALE_AXIS_ID]?.isApplied).toBe(true);
  });

  it("clears only its own slot when an axis starts a new flight", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    });

    act(() => {
      result.current.retry(LEVEL_AXIS_ID);
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(true);
    });
  });
});

describe("useProfileLevelSwitch frozen outcome copy", () => {
  it("holds the sentence it built at the moment of the write when the cache moves under it", async () => {
    const { result, rerender } = renderSwitch({ selections: { [SCALE_AXIS_ID]: "M" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(true);
    });

    const applied = "Applied — training weights everywhere now resolve as RX · M · Female.";

    expect(result.current.outcomes[LEVEL_AXIS_ID]?.message).toBe(applied);

    rerender(props({ selections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "F" } }));

    expect(result.current.outcomes[LEVEL_AXIS_ID]?.message).toBe(applied);
  });

  it("holds the failure sentence built before the write when the cache moves under it", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"));

    const { result, rerender } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    });

    const failed = "Couldn't apply. Your level is still SC · Female. Scale still not picked.";

    expect(result.current.outcomes[LEVEL_AXIS_ID]?.message).toBe(failed);

    rerender(props({ selections: { [LEVEL_AXIS_ID]: "SC", [SCALE_AXIS_ID]: "M" } }));

    expect(result.current.outcomes[LEVEL_AXIS_ID]?.message).toBe(failed);
  });
});

describe("useProfileLevelSwitch stale failures", () => {
  it("drops the failure once the value it tried to write turns out to be live", async () => {
    mutateAsync.mockRejectedValue(new Error("timeout"));

    const { result, rerender } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    });

    rerender(props({ selections: { [LEVEL_AXIS_ID]: "RX" } }));

    expect(result.current.outcomes[LEVEL_AXIS_ID]).toBeUndefined();
  });

  it("drops the failure when the coach removes the value it tried to write", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"));

    const { result, rerender } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcomes[LEVEL_AXIS_ID]?.isApplied).toBe(false);
    });

    rerender(
      props({
        axes: [plainAxis(LEVEL_AXIS_ID, "Level", ["SC"])],
        selections: { [LEVEL_AXIS_ID]: "SC" },
      }),
    );

    expect(result.current.outcomes[LEVEL_AXIS_ID]).toBeUndefined();
  });
});
