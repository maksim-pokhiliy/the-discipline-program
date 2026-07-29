import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gender, type UpdateAthleteProfileRequest } from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";

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

const renderSwitch = (overrides: Partial<UseProfileLevelSwitchArgs> = {}) =>
  renderHook((props: UseProfileLevelSwitchArgs) => useProfileLevelSwitch(props), {
    initialProps: {
      axes: AXES,
      selections: {},
      gender: Gender.FEMALE,
      isPending: false,
      mutateAsync,
      ...overrides,
    },
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
      expect(result.current.outcome?.isApplied).toBe(false);
    });

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(result.current.flight).toBeNull();
    expect(result.current.outcome?.message).toBe(
      "Couldn't apply. Your level is still SC · Female. Scale still not picked.",
    );
  });
});

describe("useProfileLevelSwitch retry", () => {
  it("does nothing once the outcome is a success", async () => {
    const { result } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcome?.isApplied).toBe(true);
    });

    act(() => {
      result.current.retry();
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
      expect(result.current.outcome?.isApplied).toBe(false);
    });

    rerender({
      axes: AXES,
      selections: { [LEVEL_AXIS_ID]: "SC", [SCALE_AXIS_ID]: "M" },
      gender: Gender.FEMALE,
      isPending: false,
      mutateAsync,
    });

    act(() => {
      result.current.retry();
    });

    expect(mutateAsync).toHaveBeenLastCalledWith({
      profileSelections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
    });
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
      expect(result.current.outcome?.isApplied).toBe(false);
    });

    rerender({
      axes: AXES,
      selections: { [LEVEL_AXIS_ID]: "RX" },
      gender: Gender.FEMALE,
      isPending: false,
      mutateAsync,
    });

    expect(result.current.outcome).toBeNull();
  });

  it("drops the failure when the coach removes the value it tried to write", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"));

    const { result, rerender } = renderSwitch({ selections: { [LEVEL_AXIS_ID]: "SC" } });

    act(() => {
      result.current.pick(LEVEL_AXIS_ID, "RX");
    });

    await waitFor(() => {
      expect(result.current.outcome?.isApplied).toBe(false);
    });

    rerender({
      axes: [plainAxis(LEVEL_AXIS_ID, "Level", ["SC"])],
      selections: { [LEVEL_AXIS_ID]: "SC" },
      gender: Gender.FEMALE,
      isPending: false,
      mutateAsync,
    });

    expect(result.current.outcome).toBeNull();
  });
});
