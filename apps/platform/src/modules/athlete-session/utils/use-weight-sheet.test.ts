import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Gender,
  type GetAthleteProfileResponse,
  HealthStatus,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { type Load } from "@repo/contracts/lms/_shared";
import {
  type CreateOneRMRecordRequest,
  type CreateOneRMRecordResponse,
  OneRMRecordSource,
} from "@repo/contracts/lms/one-rm-record";
import {
  type BlockView,
  type ResolvedLoad,
  type RowView,
  type SessionDetailResponse,
} from "@repo/contracts/lms/session-detail";

import type * as ApiModule from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import { PULSE_CLEAR_MS } from "./weight-sheet.constants";

const getProfileMock = vi.fn<() => Promise<GetAthleteProfileResponse>>();
const updateProfileMock =
  vi.fn<(data: UpdateAthleteProfileRequest) => Promise<GetAthleteProfileResponse>>();
const createOneRmMock =
  vi.fn<
    (data: CreateOneRMRecordRequest, idempotencyKey?: string) => Promise<CreateOneRMRecordResponse>
  >();
const sessionViewMock = vi.fn<() => Promise<SessionDetailResponse>>();
const toastSuccessMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>();

  return {
    ...actual,
    api: {
      ...actual.api,
      athleteProfile: {
        ...actual.api.athleteProfile,
        get: () => getProfileMock(),
        update: (data: UpdateAthleteProfileRequest) => updateProfileMock(data),
      },
      oneRMRecords: {
        ...actual.api.oneRMRecords,
        create: (data: CreateOneRMRecordRequest, idempotencyKey?: string) =>
          createOneRmMock(data, idempotencyKey),
      },
    },
  };
});

vi.mock("sonner", () => ({
  toast: { success: (message: string) => toastSuccessMock(message) },
}));

const { useWeightSheet } = await import("./use-weight-sheet");

const SESSION_ID = "clz000000000000000000sess1";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const GENDER_AXIS_ID = "clz00000000000000000axs02";
const UNRELATED_AXIS_ID = "clz00000000000000000axs03";
const EXERCISE_ID = "clz000000000000000000ex01";
const OTHER_EXERCISE_ID = "clz000000000000000000ex02";

const LEVEL_ROW_ID = "clz0000000000000000000row1";
const OTHER_LEVEL_ROW_ID = "clz0000000000000000000row2";
const MAX_ROW_ID = "clz0000000000000000000row3";
const SAME_EXERCISE_ROW_ID = "clz0000000000000000000row4";
const OTHER_EXERCISE_ROW_ID = "clz0000000000000000000row5";

const UNRELATED_PICK = "Beginner";
const LEVEL_PICK = "Scaled";
const GENDER_PICK = "Female";

const LEVEL_AND_GENDER_LOAD: Load = {
  kind: "byProfile",
  axes: [
    { axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", LEVEL_PICK], binding: null },
    { axisId: GENDER_AXIS_ID, label: "Gender", values: ["Male", GENDER_PICK], binding: "GENDER" },
  ],
  cells: [
    { coords: ["RX", "Male"], kg: 24 },
    { coords: ["RX", GENDER_PICK], kg: 18 },
    { coords: [LEVEL_PICK, "Male"], kg: 16 },
    { coords: [LEVEL_PICK, GENDER_PICK], kg: 12 },
  ],
};

const LEVEL_ONLY_LOAD: Load = {
  kind: "byProfile",
  axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", LEVEL_PICK], binding: null }],
  cells: [
    { coords: ["RX"], kg: 40 },
    { coords: [LEVEL_PICK], kg: 30 },
  ],
};

const PERCENTAGE_LOAD: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

const MISSING_ONE_RM: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_one_rm",
  prompt: "set_one_rm",
  exerciseId: EXERCISE_ID,
};

const resolvedFromOneRm = (exerciseId: string): ResolvedLoad => ({
  status: "resolved",
  kg: 96,
  perHand: false,
  source: {
    kind: "one_rm",
    exerciseId,
    percent: 80,
    baseKg: 120,
    recordedAt: "2026-07-12T10:00:00.000Z",
    recordSource: OneRMRecordSource.MANUAL,
  },
});

const baseRow = (overrides: Partial<RowView> = {}): RowView => ({
  rowId: LEVEL_ROW_ID,
  movement: "Back Squat",
  media: null,
  sets: null,
  reps: null,
  load: null,
  resolvedLoad: null,
  intensity: null,
  tempo: null,
  side: null,
  rest: null,
  modifiers: [],
  notes: null,
  ...overrides,
});

const LEVEL_ROW = baseRow({
  rowId: LEVEL_ROW_ID,
  movement: "DB Snatch",
  load: LEVEL_AND_GENDER_LOAD,
  resolvedLoad: {
    status: "unresolved",
    reason: "missing_profile_pick",
    prompt: "pick_profile",
    axisLabels: ["Level", "Gender"],
  },
});

const OTHER_LEVEL_ROW = baseRow({
  rowId: OTHER_LEVEL_ROW_ID,
  movement: "Wall Ball",
  load: LEVEL_ONLY_LOAD,
  resolvedLoad: {
    status: "unresolved",
    reason: "missing_profile_pick",
    prompt: "pick_profile",
    axisLabels: ["Level"],
  },
});

const MAX_ROW = baseRow({
  rowId: MAX_ROW_ID,
  movement: "Back Squat",
  load: PERCENTAGE_LOAD,
  resolvedLoad: MISSING_ONE_RM,
});

const SAME_EXERCISE_ROW = baseRow({
  rowId: SAME_EXERCISE_ROW_ID,
  movement: "Back Squat",
  load: PERCENTAGE_LOAD,
  resolvedLoad: resolvedFromOneRm(EXERCISE_ID),
});

const OTHER_EXERCISE_ROW = baseRow({
  rowId: OTHER_EXERCISE_ROW_ID,
  movement: "Deadlift",
  load: PERCENTAGE_LOAD,
  resolvedLoad: resolvedFromOneRm(OTHER_EXERCISE_ID),
});

const BLOCK: BlockView = {
  blockId: "clz0000000000000000000blk1",
  label: "Strength",
  intensity: null,
  note: null,
  items: [
    {
      kind: "schema",
      schema: {
        schemaId: "clz000000000000000000sch1",
        header: null,
        composition: null,
        label: null,
        isBenchmark: false,
        resultType: null,
        intensity: null,
        existingResult: null,
        items: [
          { kind: "row", row: LEVEL_ROW },
          { kind: "group", label: "Superset", members: [OTHER_LEVEL_ROW, MAX_ROW] },
          { kind: "row", row: SAME_EXERCISE_ROW },
          { kind: "row", row: OTHER_EXERCISE_ROW },
        ],
      },
    },
  ],
};

const SESSION: SessionDetailResponse = {
  session: {
    sessionId: SESSION_ID,
    planTitle: "Performance RX",
    position: "Week 3 · Day 4",
    title: "Heavy Back Squat",
    dayOfWeek: "THURSDAY",
    dayOfMonth: 18,
    summary: "1 block",
    done: false,
    completedAt: null,
  },
  blocks: [BLOCK],
};

const PROFILE: GetAthleteProfileResponse = {
  id: "clz000000000000000000prf1",
  userId: "clz000000000000000000usr1",
  image: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  profileSelections: { [UNRELATED_AXIS_ID]: UNRELATED_PICK },
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const oneRmResponse = (valueKg: number): CreateOneRMRecordResponse => ({
  id: "clz000000000000000000rec1",
  userId: PROFILE.userId,
  exerciseId: EXERCISE_ID,
  valueKg,
  recordedAt: new Date("2026-07-29T00:00:00.000Z"),
  source: OneRMRecordSource.MANUAL,
});

const renderSheet = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });

  queryClient.setQueryData(platformKeys.athleteProfile.data(), PROFILE);

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(
    () => {
      useQuery({
        queryKey: platformKeys.athleteSessionView.detail(SESSION_ID),
        queryFn: () => sessionViewMock(),
      });

      return useWeightSheet(SESSION);
    },
    { wrapper },
  );
};

type SheetHook = ReturnType<typeof renderSheet>["result"];

const openLevelSheetWithFullDraft = async (result: SheetHook): Promise<void> => {
  await act(async () => {
    result.current.openWeightSheet(LEVEL_ROW, { kind: "level" });
  });

  await act(async () => {
    result.current.controls.pickLevelCoordinate(LEVEL_AXIS_ID, LEVEL_PICK);
  });

  await act(async () => {
    result.current.controls.pickLevelCoordinate(GENDER_AXIS_ID, GENDER_PICK);
  });
};

const openMaxSheet = async (result: SheetHook, value: string): Promise<void> => {
  await act(async () => {
    result.current.openWeightSheet(MAX_ROW, { kind: "one_rm", exerciseId: EXERCISE_ID });
  });

  await act(async () => {
    result.current.controls.setMaxValue(value);
  });
};

const pulseFromMaxSave = async (result: SheetHook): Promise<void> => {
  await act(async () => {
    result.current.openWeightSheet(MAX_ROW, { kind: "one_rm", exerciseId: EXERCISE_ID });
  });

  await act(async () => {
    result.current.controls.setMaxValue("125");
  });

  await act(async () => {
    result.current.controls.saveMax();
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};

beforeEach(() => {
  getProfileMock.mockReset();
  updateProfileMock.mockReset();
  createOneRmMock.mockReset();
  sessionViewMock.mockReset();
  toastSuccessMock.mockReset();

  getProfileMock.mockResolvedValue(PROFILE);
  updateProfileMock.mockResolvedValue(PROFILE);
  createOneRmMock.mockResolvedValue(oneRmResponse(125));
  sessionViewMock.mockResolvedValue(SESSION);
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useWeightSheet level apply — the write", () => {
  it("issues exactly one PUT that routes gender to its own field and preserves unrelated picks", async () => {
    const { result } = renderSheet();

    await openLevelSheetWithFullDraft(result);

    expect(result.current.controls.isLevelDraftComplete).toBe(true);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith({
      profileSelections: {
        [UNRELATED_AXIS_ID]: UNRELATED_PICK,
        [LEVEL_AXIS_ID]: LEVEL_PICK,
      },
      gender: Gender.FEMALE,
    });

    const patch = updateProfileMock.mock.calls[0]?.[0];

    expect(patch?.profileSelections).not.toHaveProperty(GENDER_AXIS_ID);
  });

  it("refuses to write while the draft is short of a coordinate", async () => {
    const { result } = renderSheet();

    await act(async () => {
      result.current.openWeightSheet(LEVEL_ROW, { kind: "level" });
    });

    await act(async () => {
      result.current.controls.pickLevelCoordinate(LEVEL_AXIS_ID, LEVEL_PICK);
    });

    expect(result.current.controls.isLevelDraftComplete).toBe(false);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(result.current.controls.sheet).not.toBeNull();
  });
});

describe("useWeightSheet level apply — the applied moment", () => {
  it("holds the pulse and the receipt until the session refetch settles", async () => {
    let releaseSession = (): void => undefined;

    sessionViewMock.mockResolvedValueOnce(SESSION).mockImplementationOnce(
      () =>
        new Promise<SessionDetailResponse>((resolve) => {
          releaseSession = () => resolve(SESSION);
        }),
    );

    const { result } = renderSheet();

    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(1));
    await openLevelSheetWithFullDraft(result);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(2));

    expect(result.current.pulsingRowIds.size).toBe(0);
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(result.current.controls.sheet).not.toBeNull();
    expect(result.current.controls.isApplyingLevel).toBe(true);

    await act(async () => {
      releaseSession();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect([...result.current.pulsingRowIds]).toEqual([LEVEL_ROW_ID, OTHER_LEVEL_ROW_ID]);
    expect(result.current.controls.sheet).toBeNull();
    expect(result.current.controls.isApplyingLevel).toBe(false);
  });

  it("names the coordinates and the number of weights in the receipt", async () => {
    const { result } = renderSheet();

    await openLevelSheetWithFullDraft(result);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(toastSuccessMock).toHaveBeenCalledWith("Scaled · Female applied · 2 weights updated");
  });

  it("still fires the receipt but never the pulse when the refetch fails after a successful write", async () => {
    sessionViewMock
      .mockResolvedValueOnce(SESSION)
      .mockRejectedValueOnce(new Error("session refetch failed"));

    const { result } = renderSheet();

    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(1));
    await openLevelSheetWithFullDraft(result);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(result.current.pulsingRowIds.size).toBe(0);
    expect(result.current.controls.sheet).toBeNull();
  });

  it("keeps the sheet open with a failure outcome when the write itself rejects", async () => {
    updateProfileMock.mockRejectedValue(new Error("write failed"));

    const { result } = renderSheet();

    await openLevelSheetWithFullDraft(result);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(result.current.controls.levelOutcome).not.toBeNull());

    expect(result.current.controls.levelOutcome?.isApplied).toBe(false);
    expect(result.current.controls.sheet).not.toBeNull();
    expect(result.current.pulsingRowIds.size).toBe(0);
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});

describe("useWeightSheet max save", () => {
  it("stamps the save as a manual record for the tapped exercise", async () => {
    const { result } = renderSheet();

    await openMaxSheet(result, "125");

    expect(result.current.controls.canSaveMax).toBe(true);

    await act(async () => {
      result.current.controls.saveMax();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(createOneRmMock).toHaveBeenCalledTimes(1);
    expect(createOneRmMock.mock.calls[0]?.[0]).toMatchObject({
      exerciseId: EXERCISE_ID,
      valueKg: 125,
      source: OneRMRecordSource.MANUAL,
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("Back Squat 1RM · 125 kg saved");
  });

  it("pulses every row bound to the saved exercise and no other", async () => {
    const { result } = renderSheet();

    await openMaxSheet(result, "125");

    await act(async () => {
      result.current.controls.saveMax();
    });

    await waitFor(() => expect(result.current.pulsingRowIds.size).toBeGreaterThan(0));

    expect([...result.current.pulsingRowIds]).toEqual([MAX_ROW_ID, SAME_EXERCISE_ROW_ID]);
  });

  it("refuses a value that is not a positive number", async () => {
    const { result } = renderSheet();

    await openMaxSheet(result, "0");

    expect(result.current.controls.canSaveMax).toBe(false);

    await act(async () => {
      result.current.controls.saveMax();
    });

    expect(createOneRmMock).not.toHaveBeenCalled();
  });

  it("keeps the sheet open and fires no receipt when the write rejects", async () => {
    createOneRmMock.mockRejectedValue(new Error("write failed"));

    const { result } = renderSheet();

    await openMaxSheet(result, "125");

    await act(async () => {
      result.current.controls.saveMax();
    });

    await waitFor(() => expect(createOneRmMock).toHaveBeenCalledTimes(1));

    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(result.current.pulsingRowIds.size).toBe(0);
    expect(result.current.controls.sheet).not.toBeNull();
  });
});

describe("useWeightSheet pulse lifetime", () => {
  it("clears the pulse once the ratified delay elapses", async () => {
    vi.useFakeTimers();

    try {
      const { result } = renderSheet();

      await pulseFromMaxSave(result);

      expect(result.current.pulsingRowIds.size).toBeGreaterThan(0);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(PULSE_CLEAR_MS);
      });

      expect(result.current.pulsingRowIds.size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears every pending timer when the screen unmounts", async () => {
    vi.useFakeTimers();

    try {
      const { result, unmount } = renderSheet();

      await pulseFromMaxSave(result);

      expect(vi.getTimerCount()).toBeGreaterThan(0);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
