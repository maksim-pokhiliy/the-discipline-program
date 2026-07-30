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
  type SchemaCardView,
  type SessionDetailResponse,
} from "@repo/contracts/lms/session-detail";

import type * as ApiModule from "@app/lib/api";
import { platformKeys } from "@app/lib/api/keys";

import {
  MAX_OFFLINE_MESSAGE,
  PULSE_CLEAR_MS,
  RECEIPT_LEVEL_STALE,
  RECEIPT_MAX_STALE,
} from "./weight-sheet.constants";

const getProfileMock = vi.fn<() => Promise<GetAthleteProfileResponse>>();
const updateProfileMock =
  vi.fn<(data: UpdateAthleteProfileRequest) => Promise<GetAthleteProfileResponse>>();
const createOneRmMock =
  vi.fn<
    (data: CreateOneRMRecordRequest, idempotencyKey?: string) => Promise<CreateOneRMRecordResponse>
  >();
const sessionViewMock = vi.fn<() => Promise<SessionDetailResponse>>();
const recordsViewMock = vi.fn<() => Promise<{ records: [] }>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const toastErrorMock = vi.fn<(message: string) => void>();

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
  toast: {
    success: (message: string) => toastSuccessMock(message),
    error: (message: string) => toastErrorMock(message),
  },
}));

const { useWeightSheet } = await import("./use-weight-sheet");

const SESSION_ID = "clz000000000000000000sess1";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const GENDER_AXIS_ID = "clz00000000000000000axs02";
const UNRELATED_AXIS_ID = "clz00000000000000000axs03";
const TIER_AXIS_ID = "clz00000000000000000axs04";
const EXERCISE_ID = "clz000000000000000000ex01";
const OTHER_EXERCISE_ID = "clz000000000000000000ex02";

const LEVEL_ROW_ID = "clz0000000000000000000row1";
const OTHER_LEVEL_ROW_ID = "clz0000000000000000000row2";
const MAX_ROW_ID = "clz0000000000000000000row3";
const SAME_EXERCISE_ROW_ID = "clz0000000000000000000row4";
const OTHER_EXERCISE_ROW_ID = "clz0000000000000000000row5";
const TIER_ROW_ID = "clz0000000000000000000row6";
const GENDER_ROW_ID = "clz0000000000000000000row7";

const UNRELATED_PICK = "Beginner";
const LEVEL_PICK = "Scaled";
const GENDER_PICK = "Female";
const TIER_PICK = "Light";

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

const TIER_ONLY_LOAD: Load = {
  kind: "byProfile",
  axes: [
    { axisId: TIER_AXIS_ID, label: "Barbell tier", values: ["Heavy", TIER_PICK], binding: null },
  ],
  cells: [
    { coords: ["Heavy"], kg: 60 },
    { coords: [TIER_PICK], kg: 45 },
  ],
};

const GENDER_ONLY_LOAD: Load = {
  kind: "byProfile",
  axes: [
    { axisId: GENDER_AXIS_ID, label: "Gender", values: ["Male", GENDER_PICK], binding: "GENDER" },
  ],
  cells: [
    { coords: ["Male"], kg: 20 },
    { coords: [GENDER_PICK], kg: 14 },
  ],
};

const PERCENTAGE_LOAD: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

const MISSING_ONE_RM: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_one_rm",
  prompt: "set_one_rm",
  exerciseId: EXERCISE_ID,
};

const MISSING_PROFILE_PICK: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_profile_pick",
  prompt: "pick_profile",
  axisLabels: ["Level"],
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
  resolvedLoad: MISSING_PROFILE_PICK,
});

const TIER_ROW = baseRow({
  rowId: TIER_ROW_ID,
  movement: "Push Press",
  load: TIER_ONLY_LOAD,
  resolvedLoad: MISSING_PROFILE_PICK,
});

const GENDER_ROW = baseRow({
  rowId: GENDER_ROW_ID,
  movement: "Row",
  load: GENDER_ONLY_LOAD,
  resolvedLoad: MISSING_PROFILE_PICK,
});

const MAX_ROW = baseRow({
  rowId: MAX_ROW_ID,
  movement: "Back Squat",
  load: PERCENTAGE_LOAD,
  resolvedLoad: MISSING_ONE_RM,
});

const resolvedFromProfile = (kg: number, coords: string[]): ResolvedLoad => ({
  status: "resolved",
  kg,
  perHand: false,
  source: {
    kind: "profile",
    coords: coords.map((value, index) => ({
      axisId: index === 0 ? LEVEL_AXIS_ID : GENDER_AXIS_ID,
      label: index === 0 ? "Level" : "Gender",
      value,
      binding: index === 0 ? null : "GENDER",
    })),
  },
});

const SETTLED_LEVEL_ROW = baseRow({
  rowId: OTHER_LEVEL_ROW_ID,
  movement: "Wall Ball",
  load: LEVEL_ONLY_LOAD,
  resolvedLoad: resolvedFromProfile(30, [LEVEL_PICK]),
});

const SETTLED_TWO_AXIS_ROW = baseRow({
  rowId: LEVEL_ROW_ID,
  movement: "DB Snatch",
  load: LEVEL_AND_GENDER_LOAD,
  resolvedLoad: resolvedFromProfile(12, [LEVEL_PICK, GENDER_PICK]),
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

type SchemaItem = SchemaCardView["items"][number];

const row = (view: RowView): SchemaItem => ({ kind: "row", row: view });

const group = (label: string, members: RowView[]): SchemaItem => ({
  kind: "group",
  label,
  members,
});

const sessionOf = (items: SchemaItem[]): SessionDetailResponse => {
  const block: BlockView = {
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
          items,
        },
      },
    ],
  };

  return {
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
    blocks: [block],
  };
};

const SESSION = sessionOf([
  row(LEVEL_ROW),
  group("Superset", [OTHER_LEVEL_ROW, MAX_ROW]),
  row(SAME_EXERCISE_ROW),
  row(OTHER_EXERCISE_ROW),
  row(TIER_ROW),
]);

const GENDER_ONLY_SESSION = sessionOf([row(GENDER_ROW)]);

const MIXED_DELTA_SESSION = sessionOf([row(LEVEL_ROW), row(SETTLED_LEVEL_ROW), row(TIER_ROW)]);

const SETTLED_SESSION = sessionOf([row(SETTLED_TWO_AXIS_ROW), row(SETTLED_LEVEL_ROW)]);

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

type RenderOptions = {
  session?: SessionDetailResponse;
  profile?: GetAthleteProfileResponse | null;
};

const renderSheet = ({ session = SESSION, profile = PROFILE }: RenderOptions = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });

  if (profile !== null) {
    getProfileMock.mockResolvedValue(profile);
    queryClient.setQueryData(platformKeys.athleteProfile.data(), profile);
  }

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(
    () => {
      useQuery({
        queryKey: platformKeys.athleteSessionView.detail(SESSION_ID),
        queryFn: () => sessionViewMock(),
      });
      useQuery({
        queryKey: platformKeys.athleteRecords.data(),
        queryFn: () => recordsViewMock(),
      });

      return useWeightSheet(session);
    },
    { wrapper },
  );
};

type SheetHook = ReturnType<typeof renderSheet>["result"];

const deferred = <T>(): { promise: Promise<T>; resolve: (value: T) => void } => {
  let resolve = (_value: T): void => undefined;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });

  return { promise, resolve };
};

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
  await openMaxSheet(result, "125");

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
  recordsViewMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();

  getProfileMock.mockResolvedValue(PROFILE);
  updateProfileMock.mockResolvedValue(PROFILE);
  createOneRmMock.mockResolvedValue(oneRmResponse(125));
  sessionViewMock.mockResolvedValue(SESSION);
  recordsViewMock.mockResolvedValue({ records: [] });
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

  it("refuses to write a wholesale replace while the athlete's profile is still in flight", async () => {
    const profileFlight = deferred<GetAthleteProfileResponse>();

    getProfileMock.mockReturnValue(profileFlight.promise);

    const { result } = renderSheet({ profile: null });

    await openLevelSheetWithFullDraft(result);

    expect(result.current.controls.isLevelDraftComplete).toBe(false);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(result.current.controls.sheet).not.toBeNull();

    await act(async () => {
      profileFlight.resolve(PROFILE);
    });
  });

  it("refuses to write a wholesale replace after the profile request failed", async () => {
    getProfileMock.mockRejectedValue(new Error("profile unavailable"));

    const { result } = renderSheet({ profile: null });

    await waitFor(() => expect(getProfileMock).toHaveBeenCalled());
    await openLevelSheetWithFullDraft(result);

    expect(result.current.controls.isLevelDraftComplete).toBe(false);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("shows the athlete's saved coordinates as soon as the profile lands under an open sheet", async () => {
    const profileFlight = deferred<GetAthleteProfileResponse>();

    getProfileMock.mockReturnValue(profileFlight.promise);

    const { result } = renderSheet({ profile: null });

    await act(async () => {
      result.current.openWeightSheet(LEVEL_ROW, { kind: "level" });
    });

    expect(result.current.controls.levelCoordinates).toEqual({});
    expect(result.current.controls.isLevelDraftComplete).toBe(false);

    await act(async () => {
      profileFlight.resolve({
        ...PROFILE,
        gender: Gender.FEMALE,
        profileSelections: { [LEVEL_AXIS_ID]: LEVEL_PICK },
      });
    });

    await waitFor(() => expect(result.current.controls.isLevelDraftComplete).toBe(true));

    expect(result.current.controls.levelCoordinates).toEqual({
      [LEVEL_AXIS_ID]: LEVEL_PICK,
      [GENDER_AXIS_ID]: GENDER_PICK,
    });
  });

  it("leaves the selections map alone for a row whose only axis is the bound gender axis", async () => {
    const { result } = renderSheet({ session: GENDER_ONLY_SESSION });

    await act(async () => {
      result.current.openWeightSheet(GENDER_ROW, { kind: "level" });
    });

    await act(async () => {
      result.current.controls.pickLevelCoordinate(GENDER_AXIS_ID, GENDER_PICK);
    });

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(updateProfileMock).toHaveBeenCalledWith({ gender: Gender.FEMALE });
  });

  it("strips a bound-axis key out of the saved map it echoes back", async () => {
    const { result } = renderSheet({
      profile: {
        ...PROFILE,
        profileSelections: {
          [UNRELATED_AXIS_ID]: UNRELATED_PICK,
          [GENDER_AXIS_ID]: "Male",
        },
      },
    });

    await openLevelSheetWithFullDraft(result);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(updateProfileMock).toHaveBeenCalledWith({
      profileSelections: {
        [UNRELATED_AXIS_ID]: UNRELATED_PICK,
        [LEVEL_AXIS_ID]: LEVEL_PICK,
      },
      gender: Gender.FEMALE,
    });
  });
});

describe("useWeightSheet level apply — the applied moment", () => {
  it("holds the pulse and the receipt until the session refetch settles", async () => {
    const sessionFlight = deferred<SessionDetailResponse>();

    sessionViewMock
      .mockResolvedValueOnce(SESSION)
      .mockImplementationOnce(() => sessionFlight.promise);

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
      sessionFlight.resolve(SESSION);
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect([...result.current.pulsingRowIds]).toEqual([LEVEL_ROW_ID, OTHER_LEVEL_ROW_ID]);
    expect(result.current.controls.sheet).toBeNull();
    expect(result.current.controls.isApplyingLevel).toBe(false);
  });

  it("leaves out a row keyed on an axis the apply never touched", async () => {
    const { result } = renderSheet();

    await openLevelSheetWithFullDraft(result);

    expect(result.current.controls.levelWeightCount).toBe(2);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect([...result.current.pulsingRowIds]).toEqual([LEVEL_ROW_ID, OTHER_LEVEL_ROW_ID]);
    expect(result.current.pulsingRowIds.has(TIER_ROW_ID)).toBe(false);
    expect(toastSuccessMock).toHaveBeenCalledWith("Scaled · Female applied · 2 weights updated");
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

  it("counts and pulses the weights that moved, not every weight the axis governs", async () => {
    const { result } = renderSheet({ session: MIXED_DELTA_SESSION });

    await openLevelSheetWithFullDraft(result);

    expect(result.current.controls.levelWeightCount).toBe(2);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect([...result.current.pulsingRowIds]).toEqual([LEVEL_ROW_ID]);
    expect(result.current.pulsingRowIds.has(OTHER_LEVEL_ROW_ID)).toBe(false);
    expect(toastSuccessMock).toHaveBeenCalledWith("Scaled · Female applied · 1 weight updated");
  });

  it("claims no count and pulses nothing when Apply re-states the level already in force", async () => {
    const { result } = renderSheet({
      session: SETTLED_SESSION,
      profile: {
        ...PROFILE,
        gender: Gender.FEMALE,
        profileSelections: { [UNRELATED_AXIS_ID]: UNRELATED_PICK, [LEVEL_AXIS_ID]: LEVEL_PICK },
      },
    });

    await act(async () => {
      result.current.openWeightSheet(SETTLED_TWO_AXIS_ROW, { kind: "level" });
    });

    await waitFor(() => expect(result.current.controls.isLevelDraftComplete).toBe(true));

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(toastSuccessMock).toHaveBeenCalledWith("Scaled · Female applied");
    expect(result.current.pulsingRowIds.size).toBe(0);
  });

  it("says the screen is stale instead of claiming updated weights when the refetch fails", async () => {
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
    expect(toastSuccessMock).toHaveBeenCalledWith(RECEIPT_LEVEL_STALE);
    expect(toastSuccessMock).not.toHaveBeenCalledWith(
      "Scaled · Female applied · 2 weights updated",
    );
    expect(result.current.pulsingRowIds.size).toBe(0);
    expect(result.current.controls.sheet).toBeNull();
  });

  it("leaves a freshly opened sheet unlocked while the previous apply is still settling", async () => {
    const writeFlight = deferred<GetAthleteProfileResponse>();

    updateProfileMock.mockReturnValue(writeFlight.promise);

    const { result } = renderSheet();

    await openLevelSheetWithFullDraft(result);

    await act(async () => {
      result.current.controls.applyLevel();
    });

    await waitFor(() => expect(result.current.controls.isApplyingLevel).toBe(true));

    await act(async () => {
      result.current.controls.closeSheet();
    });

    await act(async () => {
      result.current.openWeightSheet(OTHER_LEVEL_ROW, { kind: "level" });
    });

    expect(result.current.controls.isApplyingLevel).toBe(false);
    expect(result.current.controls.isOtherApplyPending).toBe(true);

    await act(async () => {
      result.current.controls.pickLevelCoordinate(LEVEL_AXIS_ID, "RX");
    });

    expect(result.current.controls.levelCoordinates).toEqual({ [LEVEL_AXIS_ID]: "RX" });

    await act(async () => {
      writeFlight.resolve(PROFILE);
    });

    await waitFor(() => expect(result.current.controls.isOtherApplyPending).toBe(false));
  });

  it("exposes the saved coordinates apart from the draft laid over them", async () => {
    const { result } = renderSheet();

    await act(async () => {
      result.current.openWeightSheet(LEVEL_ROW, { kind: "level" });
    });

    expect(result.current.controls.levelSavedCoordinates).toEqual({});

    await act(async () => {
      result.current.controls.pickLevelCoordinate(LEVEL_AXIS_ID, LEVEL_PICK);
    });

    expect(result.current.controls.levelCoordinates).toEqual({ [LEVEL_AXIS_ID]: LEVEL_PICK });
    expect(result.current.controls.levelSavedCoordinates).toEqual({});
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

  it("refuses a value the API's kg bounds would reject", async () => {
    const { result } = renderSheet();

    await openMaxSheet(result, "102.555");

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

  it("writes one record however many times the athlete taps Save before the sheet closes", async () => {
    const sessionFlight = deferred<SessionDetailResponse>();

    sessionViewMock
      .mockResolvedValueOnce(SESSION)
      .mockImplementationOnce(() => sessionFlight.promise);

    const { result } = renderSheet();

    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(1));
    await openMaxSheet(result, "125");

    await act(async () => {
      result.current.controls.saveMax();
    });

    await waitFor(() => expect(createOneRmMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(2));

    expect(result.current.controls.sheet).not.toBeNull();

    await act(async () => {
      result.current.controls.saveMax();
    });

    expect(createOneRmMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      sessionFlight.resolve(SESSION);
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(createOneRmMock).toHaveBeenCalledTimes(1);
  });

  it("says the screen is stale instead of naming a saved max when the refetch fails", async () => {
    sessionViewMock
      .mockResolvedValueOnce(SESSION)
      .mockRejectedValueOnce(new Error("session refetch failed"));

    const { result } = renderSheet();

    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(1));
    await openMaxSheet(result, "125");

    await act(async () => {
      result.current.controls.saveMax();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(createOneRmMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(RECEIPT_MAX_STALE);
    expect(result.current.pulsingRowIds.size).toBe(0);
  });

  it("refreshes the records surface the athlete taps through to next", async () => {
    const { result } = renderSheet();

    await waitFor(() => expect(recordsViewMock).toHaveBeenCalledTimes(1));
    await openMaxSheet(result, "125");

    await act(async () => {
      result.current.controls.saveMax();
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(recordsViewMock).toHaveBeenCalledTimes(2);
  });

  it("refuses the save offline and says so instead of firing a doomed request", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    const { result } = renderSheet();

    await openMaxSheet(result, "125");

    await act(async () => {
      result.current.controls.saveMax();
    });

    expect(createOneRmMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(MAX_OFFLINE_MESSAGE);
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(result.current.controls.sheet).not.toBeNull();
  });
});

describe("useWeightSheet sheet identity", () => {
  it("never closes a sheet the athlete opened after the save that is still settling", async () => {
    const sessionFlight = deferred<SessionDetailResponse>();

    sessionViewMock
      .mockResolvedValueOnce(SESSION)
      .mockImplementationOnce(() => sessionFlight.promise);

    const { result } = renderSheet();

    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(1));
    await openMaxSheet(result, "125");

    await act(async () => {
      result.current.controls.saveMax();
    });

    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(2));

    await act(async () => {
      result.current.controls.closeSheet();
    });

    await act(async () => {
      result.current.openWeightSheet(LEVEL_ROW, { kind: "level" });
    });

    await act(async () => {
      sessionFlight.resolve(SESSION);
    });

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(result.current.controls.sheet).toEqual({ kind: "level", row: LEVEL_ROW });
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
