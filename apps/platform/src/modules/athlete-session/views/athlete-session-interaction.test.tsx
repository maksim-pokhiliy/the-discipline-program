import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  type ResolvedLoadSource,
  type RowView,
  type SchemaCardView,
  type SessionDetailResponse,
} from "@repo/contracts/lms/session-detail";

import type * as ApiModule from "@app/lib/api";
import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const getProfileMock = vi.fn<() => Promise<GetAthleteProfileResponse>>();
const updateProfileMock =
  vi.fn<(data: UpdateAthleteProfileRequest) => Promise<GetAthleteProfileResponse>>();
const createOneRmMock =
  vi.fn<
    (data: CreateOneRMRecordRequest, idempotencyKey?: string) => Promise<CreateOneRMRecordResponse>
  >();
const sessionViewMock = vi.fn<() => Promise<SessionDetailResponse>>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const toastErrorMock = vi.fn<(message: string) => void>();
const createPerformedSessionAsync = vi.fn();
const logBenchmarkMutate = vi.fn();

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
      athleteSessionView: { ...actual.api.athleteSessionView, get: () => sessionViewMock() },
      oneRMRecords: {
        ...actual.api.oneRMRecords,
        create: (data: CreateOneRMRecordRequest, idempotencyKey?: string) =>
          createOneRmMock(data, idempotencyKey),
      },
    },
  };
});

vi.mock("@app/lib/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof Hooks>();

  return {
    ...actual,
    useCreatePerformedSession: () => ({
      mutateAsync: createPerformedSessionAsync,
      isPending: false,
    }),
    useLogBenchmarkResult: () => ({ mutate: logBenchmarkMutate, isPending: false }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
    error: (message: string) => toastErrorMock(message),
  },
}));

const { AthleteSessionView } = await import("./athlete-session-view");

const SESSION_ID = "clz000000000000000000sess1";
const PERFORMED_ID = "clz00000000000000000perf01";
const EX_ID = "clz0000000000000000000ex01";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const GENDER_AXIS_ID = "clz00000000000000000axs02";
const UNRELATED_AXIS_ID = "clz00000000000000000axs03";
const BENCHMARK_SCHEMA_ID = "clz000000000000000000sch3";

const UNRELATED_PICK = "Beginner";
const SESSION_TITLE = "Workout";

const profile = (
  profileSelections: Record<string, string>,
  gender: Gender | null = null,
): GetAthleteProfileResponse => ({
  id: "clz000000000000000000prf1",
  userId: "clz000000000000000000usr1",
  image: null,
  gender,
  heightCm: null,
  weightKg: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  profileSelections,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

const oneRmResponse = (valueKg: number): CreateOneRMRecordResponse => ({
  id: "clz000000000000000000rec1",
  userId: "clz000000000000000000usr1",
  exerciseId: EX_ID,
  valueKg,
  recordedAt: new Date("2026-07-29T00:00:00.000Z"),
  source: OneRMRecordSource.MANUAL,
});

const row = (rowId: string, movement: string, overrides: Partial<RowView> = {}): RowView => ({
  rowId,
  movement,
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

const plainSchema = (
  schemaId: string,
  header: string,
  items: SchemaCardView["items"],
): SchemaCardView => ({
  schemaId,
  header,
  composition: null,
  label: null,
  isBenchmark: false,
  resultType: null,
  intensity: null,
  existingResult: null,
  items,
});

const block = (schema: SchemaCardView, blockId: string, label: string): BlockView => ({
  blockId,
  label,
  intensity: null,
  note: null,
  items: [{ kind: "schema", schema }],
});

const levelAndGenderLoad: Load = {
  kind: "byProfile",
  axes: [
    { axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null },
    { axisId: GENDER_AXIS_ID, label: "Gender", values: ["Male", "Female"], binding: "GENDER" },
  ],
  cells: [
    { coords: ["RX", "Male"], kg: 24 },
    { coords: ["RX", "Female"], kg: 18 },
    { coords: ["Scaled", "Male"], kg: 16 },
    { coords: ["Scaled", "Female"], kg: 12 },
  ],
};

const levelOnlyLoad: Load = {
  kind: "byProfile",
  axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null }],
  cells: [
    { coords: ["RX"], kg: 40 },
    { coords: ["Scaled"], kg: 30 },
  ],
};

const groupedLoad: Load = {
  kind: "byProfile",
  axes: [{ axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null }],
  cells: [
    { coords: ["RX"], kg: 24 },
    { coords: ["Scaled"], kg: 16 },
  ],
};

const percentageLoad: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

const UNPICKED_GRID: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_profile_pick",
  prompt: "pick_profile",
  axisLabels: ["Level", "Gender"],
};

const UNPICKED_LEVEL: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_profile_pick",
  prompt: "pick_profile",
  axisLabels: ["Level"],
};

const MISSING_ONE_RM: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_one_rm",
  prompt: "set_one_rm",
  exerciseId: EX_ID,
};

const ONE_RM_SOURCE: ResolvedLoadSource = {
  kind: "one_rm",
  exerciseId: EX_ID,
  percent: 80,
  baseKg: 120,
  recordedAt: "2026-07-12T10:00:00.000Z",
  recordSource: OneRMRecordSource.MANUAL,
};

const RESOLVED_FROM_RECORD: ResolvedLoad = {
  status: "resolved",
  kg: 96,
  perHand: false,
  source: ONE_RM_SOURCE,
};

const gridSource = (level: string, gender: string): ResolvedLoadSource => ({
  kind: "profile",
  coords: [
    { axisId: LEVEL_AXIS_ID, label: "Level", value: level, binding: null },
    { axisId: GENDER_AXIS_ID, label: "Gender", value: gender, binding: "GENDER" },
  ],
});

const gridRow = (resolvedLoad: ResolvedLoad): RowView =>
  row("clz000000000000000000row1", "DB Snatch", { load: levelAndGenderLoad, resolvedLoad });

const levelOnlyRow = (resolvedLoad: ResolvedLoad): RowView =>
  row("clz000000000000000000row2", "Wall Ball", { load: levelOnlyLoad, resolvedLoad });

const maxRow = (resolvedLoad: ResolvedLoad): RowView =>
  row("clz000000000000000000row3", "Back Squat", { load: percentageLoad, resolvedLoad });

const groupedSchema = (): SchemaCardView =>
  plainSchema("clz000000000000000000sch4", "Kettlebell Complex", [
    {
      kind: "group",
      label: "Superset",
      members: [
        row("clz000000000000000000row5", "Kettlebell Swing", {
          reps: { kind: "count", value: 18 },
          load: groupedLoad,
          resolvedLoad: UNPICKED_LEVEL,
        }),
      ],
    },
  ]);

const benchmarkSchema: SchemaCardView = {
  schemaId: BENCHMARK_SCHEMA_ID,
  header: "Cindy",
  composition: {
    repetition: { kind: "timeCap", cap: { min: 20, unit: "min" } },
    benchmark: { resultType: "rounds_reps" },
  },
  label: { kind: "timeCap", family: "TIME_BOUNDED" },
  isBenchmark: true,
  resultType: "rounds_reps",
  intensity: null,
  existingResult: null,
  items: [
    {
      kind: "row",
      row: row("clz000000000000000000row6", "Air Squat", {
        reps: { kind: "count", value: 15 },
        load: { kind: "bodyweight" },
        resolvedLoad: { status: "bodyweight" },
      }),
    },
  ],
};

const loadBenchmarkSchema: SchemaCardView = {
  schemaId: BENCHMARK_SCHEMA_ID,
  header: "Find 1RM",
  composition: { repetition: { kind: "count", count: 1 }, benchmark: { resultType: "load" } },
  label: { kind: "rounds", family: "ROUNDS" },
  isBenchmark: true,
  resultType: "load",
  intensity: null,
  existingResult: null,
  items: [
    {
      kind: "row",
      row: row("clz000000000000000000row7", "Back Squat", {
        sets: 1,
        reps: { kind: "count", value: 1 },
        load: { kind: "percentage", value: 100, reference: { scope: "self" } },
        resolvedLoad: MISSING_ONE_RM,
      }),
    },
  ],
};

const buildResponse = (
  blocks: BlockView[],
  overrides: Partial<SessionDetailResponse["session"]> = {},
): SessionDetailResponse => ({
  session: {
    sessionId: SESSION_ID,
    planTitle: "Performance RX",
    position: "Week 3 · Day 4 · Performance RX",
    title: SESSION_TITLE,
    dayOfWeek: "THURSDAY",
    dayOfMonth: 18,
    summary: "1 block",
    done: false,
    completedAt: null,
    ...overrides,
  },
  blocks,
});

const gridSession = (grid: ResolvedLoad, level: ResolvedLoad): SessionDetailResponse =>
  buildResponse([
    block(
      plainSchema("clz000000000000000000sch1", "Power", [
        { kind: "row", row: gridRow(grid) },
        { kind: "row", row: levelOnlyRow(level) },
      ]),
      "clz0000000000000000000blk1",
      "Power",
    ),
  ]);

const maxSession = (resolvedLoad: ResolvedLoad): SessionDetailResponse =>
  buildResponse([
    block(
      plainSchema("clz000000000000000000sch2", "Strength", [
        { kind: "row", row: maxRow(resolvedLoad) },
      ]),
      "clz0000000000000000000blk2",
      "Strength",
    ),
  ]);

const setSession = (response: SessionDetailResponse): void => {
  sessionViewMock.mockResolvedValue(response);
};

const setProfile = (
  profileSelections: Record<string, string>,
  gender: Gender | null = null,
): void => {
  getProfileMock.mockResolvedValue(profile(profileSelections, gender));
};

const renderSession = async (): Promise<HTMLElement> => {
  const { container } = render(<AthleteSessionView sessionId={SESSION_ID} />);

  await screen.findByText(SESSION_TITLE);

  return container;
};

const getRail = (container: HTMLElement): HTMLElement => {
  const aside = container.querySelector("aside");

  if (aside === null) {
    throw new Error("completion rail not found");
  }

  return aside;
};

const firstCallArg = (mock: ReturnType<typeof vi.fn>): unknown => {
  const call = mock.mock.calls[0];

  if (call === undefined) {
    throw new Error("expected the mock to have been called");
  }

  return call[0];
};

const profilePatch = (index = 0): UpdateAthleteProfileRequest => {
  const call = updateProfileMock.mock.calls[index];

  if (call === undefined) {
    throw new Error("expected a profile write");
  }

  return call[0];
};

const oneRmCall = (index: number): [CreateOneRMRecordRequest, string | undefined] => {
  const call = createOneRmMock.mock.calls[index];

  if (call === undefined) {
    throw new Error("expected a one-rm write");
  }

  return [call[0], call[1]];
};

const lastElement = (elements: HTMLElement[]): HTMLElement => {
  const element = elements[elements.length - 1];

  if (element === undefined) {
    throw new Error("expected at least one element");
  }

  return element;
};

const chip = (name: string): HTMLElement => screen.getByRole("button", { name });

const sheet = (): HTMLElement => screen.getByRole("dialog");

const maxInput = (): HTMLElement => screen.getByLabelText("New 1RM (kg)");

beforeEach(() => {
  vi.clearAllMocks();
  setProfile({});
  updateProfileMock.mockImplementation(async () => profile({}));
  createOneRmMock.mockResolvedValue(oneRmResponse(140));
  createPerformedSessionAsync.mockResolvedValue({ id: PERFORMED_ID });
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});

describe("AthleteSessionView — the level sheet routes the gender", () => {
  it("issues exactly one write that carries the gender on its own field", async () => {
    setProfile({ [UNRELATED_AXIS_ID]: UNRELATED_PICK });
    setSession(gridSession(UNPICKED_GRID, UNPICKED_LEVEL));

    await renderSession();

    fireEvent.click(chip("12–24 kg, Pick your level"));
    fireEvent.click(await screen.findByRole("radio", { name: "Scaled" }));
    fireEvent.click(screen.getByRole("radio", { name: "Female" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Scaled · Female" }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(updateProfileMock).toHaveBeenCalledTimes(1);

    const patch = profilePatch();

    expect(patch.gender).toBe(Gender.FEMALE);
    expect(Object.keys(patch.profileSelections ?? {})).not.toContain(GENDER_AXIS_ID);
    expect(patch.profileSelections).toEqual({
      [UNRELATED_AXIS_ID]: UNRELATED_PICK,
      [LEVEL_AXIS_ID]: "Scaled",
    });
  });

  it("writes nothing while the grid is short of a coordinate", async () => {
    setSession(gridSession(UNPICKED_GRID, UNPICKED_LEVEL));

    await renderSession();

    fireEvent.click(chip("12–24 kg, Pick your level"));
    fireEvent.click(await screen.findByRole("radio", { name: "Scaled" }));

    const cta = screen.getByRole("button", { name: "Pick gender" });

    expect(cta).toBeDisabled();

    fireEvent.click(cta);

    expect(updateProfileMock).not.toHaveBeenCalled();
    expect(sheet()).toBeInTheDocument();
  });

  it("seeds the draft from the gender the athlete already saved", async () => {
    setProfile({ [LEVEL_AXIS_ID]: "RX" }, Gender.MALE);
    setSession(gridSession(UNPICKED_GRID, UNPICKED_LEVEL));

    await renderSession();

    fireEvent.click(chip("12–24 kg, Pick your level"));

    expect(await screen.findByRole("radio", { name: "Male Current" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "RX Current" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply RX · Male" })).toBeEnabled();
  });

  it("keeps the sheet open with a retry when the write is refused", async () => {
    setProfile({ [LEVEL_AXIS_ID]: "RX" }, Gender.MALE);
    setSession(gridSession(UNPICKED_GRID, UNPICKED_LEVEL));
    updateProfileMock.mockRejectedValueOnce(new Error("profile write refused"));

    await renderSession();

    fireEvent.click(chip("12–24 kg, Pick your level"));
    fireEvent.click(await screen.findByRole("button", { name: "Apply RX · Male" }));

    const strip = await screen.findByRole("alert");

    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(sheet()).toBeInTheDocument();

    fireEvent.click(within(strip).getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(updateProfileMock).toHaveBeenCalledTimes(2);
  });

  it("closes without writing when the sheet is cancelled", async () => {
    setSession(gridSession(UNPICKED_GRID, UNPICKED_LEVEL));

    await renderSession();

    fireEvent.click(chip("12–24 kg, Pick your level"));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(updateProfileMock).not.toHaveBeenCalled();
  });
});

describe("AthleteSessionView — the applied moment", () => {
  it("holds the receipt until the refreshed weights are on screen", async () => {
    let releaseSession = (): void => undefined;

    setProfile({ [LEVEL_AXIS_ID]: "RX" }, Gender.MALE);
    sessionViewMock
      .mockResolvedValueOnce(
        gridSession(
          { status: "resolved", kg: 24, perHand: false, source: gridSource("RX", "Male") },
          { status: "resolved", kg: 40, perHand: false },
        ),
      )
      .mockImplementationOnce(
        () =>
          new Promise<SessionDetailResponse>((resolve) => {
            releaseSession = () =>
              resolve(
                gridSession(
                  {
                    status: "resolved",
                    kg: 12,
                    perHand: false,
                    source: gridSource("Scaled", "Female"),
                  },
                  { status: "resolved", kg: 30, perHand: false },
                ),
              );
          }),
      );

    await renderSession();

    fireEvent.click(chip("24 kg, RX · Male, change"));
    fireEvent.click(await screen.findByRole("radio", { name: "Scaled" }));
    fireEvent.click(screen.getByRole("radio", { name: "Female" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Scaled · Female" }));

    await waitFor(() => expect(sessionViewMock).toHaveBeenCalledTimes(2));

    expect(screen.getByText("24 kg")).toBeInTheDocument();
    expect(screen.queryByText("12 kg")).not.toBeInTheDocument();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(sheet()).toBeInTheDocument();
    expect(screen.getAllByText("Applying…")).toHaveLength(2);

    releaseSession();

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(screen.getByText("12 kg")).toBeInTheDocument();
    expect(screen.queryByText("24 kg")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toastSuccessMock).toHaveBeenCalledWith("Scaled · Female applied · 2 weights updated");
  });
});

describe("AthleteSessionView — a weight inside a superset", () => {
  it("opens the sheet bound to the tapped member and applies its first pick", async () => {
    setSession(
      buildResponse([block(groupedSchema(), "clz0000000000000000000blk3", "Kettlebell Complex")]),
    );

    await renderSession();

    fireEvent.click(chip("RX: 24 / Scaled: 16 kg, Pick your level"));
    fireEvent.click(await screen.findByRole("radio", { name: "Scaled" }));

    expect(screen.getByText("This row · Kettlebell Swing: 16 kg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply Scaled" }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(updateProfileMock).toHaveBeenCalledTimes(1);
    expect(profilePatch().profileSelections).toEqual({ [LEVEL_AXIS_ID]: "Scaled" });
    expect(profilePatch()).not.toHaveProperty("gender");
    expect(toastSuccessMock).toHaveBeenCalledWith("Scaled applied · 1 weight updated");
  });
});

describe("AthleteSessionView — the max sheet", () => {
  it("saves a manual record for the tapped exercise and reports it", async () => {
    setSession(maxSession(MISSING_ONE_RM));

    await renderSession();

    fireEvent.click(chip("80%, Set your max"));

    expect(await screen.findByText("Your Back Squat max")).toBeInTheDocument();

    fireEvent.change(maxInput(), { target: { value: "140" } });
    fireEvent.click(screen.getByRole("button", { name: "Save 140 kg" }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(createOneRmMock).toHaveBeenCalledTimes(1);
    expect(oneRmCall(0)[0]).toMatchObject({
      exerciseId: EX_ID,
      valueKg: 140,
      source: OneRMRecordSource.MANUAL,
      recordedAt: expect.any(Date),
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("Back Squat 1RM · 140 kg saved");
  });

  it("refuses a negative max by disabling the save rather than blocking the keystroke (QA-010)", async () => {
    setSession(maxSession(MISSING_ONE_RM));

    await renderSession();

    fireEvent.click(chip("80%, Set your max"));
    fireEvent.change(await screen.findByLabelText("New 1RM (kg)"), { target: { value: "-5" } });

    expect(maxInput()).toHaveValue("-5");
    expect(screen.getByRole("button", { name: "Enter weight" })).toBeDisabled();
    expect(createOneRmMock).not.toHaveBeenCalled();
  });

  it("does not save the max twice while the write is in flight (QA-002)", async () => {
    let releaseCreate = (): void => undefined;

    setSession(maxSession(MISSING_ONE_RM));
    createOneRmMock.mockImplementationOnce(
      () =>
        new Promise<CreateOneRMRecordResponse>((resolve) => {
          releaseCreate = () => resolve(oneRmResponse(140));
        }),
    );

    await renderSession();

    fireEvent.click(chip("80%, Set your max"));
    fireEvent.change(await screen.findByLabelText("New 1RM (kg)"), { target: { value: "140" } });

    const save = screen.getByRole("button", { name: "Save 140 kg" });

    fireEvent.click(save);

    await waitFor(() => expect(save).toBeDisabled());

    fireEvent.click(save);
    fireEvent.click(save);

    expect(createOneRmMock).toHaveBeenCalledTimes(1);

    releaseCreate();

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));
  });

  it("keeps the sheet open and reports nothing when the record write fails", async () => {
    setSession(maxSession(MISSING_ONE_RM));
    createOneRmMock.mockRejectedValueOnce(new Error("record write failed"));

    await renderSession();

    fireEvent.click(chip("80%, Set your max"));
    fireEvent.change(await screen.findByLabelText("New 1RM (kg)"), { target: { value: "140" } });
    fireEvent.click(screen.getByRole("button", { name: "Save 140 kg" }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));

    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(sheet()).toBeInTheDocument();
  });

  it("lets a resolved percentage row be corrected again straight away", async () => {
    sessionViewMock
      .mockResolvedValueOnce(maxSession(MISSING_ONE_RM))
      .mockResolvedValue(maxSession(RESOLVED_FROM_RECORD));

    await renderSession();

    fireEvent.click(chip("80%, Set your max"));
    fireEvent.change(await screen.findByLabelText("New 1RM (kg)"), { target: { value: "140" } });
    fireEvent.click(screen.getByRole("button", { name: "Save 140 kg" }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    fireEvent.click(await screen.findByRole("button", { name: "96 kg, 80% of 120, change" }));

    expect(await screen.findByText("Latest record · 120 kg · 12 Jul 2026")).toBeInTheDocument();

    fireEvent.change(maxInput(), { target: { value: "130" } });
    fireEvent.click(screen.getByRole("button", { name: "Save 130 kg" }));

    await waitFor(() => expect(createOneRmMock).toHaveBeenCalledTimes(2));

    expect(oneRmCall(1)[0]).toMatchObject({ exerciseId: EX_ID, valueKg: 130 });
    expect(oneRmCall(1)[1]).not.toBe(oneRmCall(0)[1]);
  });
});

describe("AthleteSessionView — in-schema benchmark logging", () => {
  it("logs the benchmark result from its schema card in a single decoupled request (Must-Test 15)", async () => {
    setSession(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon")]));

    await renderSession();

    fireEvent.click(screen.getByRole("button", { name: /log your result/i }));
    fireEvent.change(screen.getByLabelText(/rounds/i), { target: { value: "18" } });
    fireEvent.change(screen.getByLabelText(/^reps$/i), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /save result/i }));

    expect(logBenchmarkMutate).toHaveBeenCalledTimes(1);
    expect(firstCallArg(logBenchmarkMutate)).toEqual({
      sessionId: SESSION_ID,
      data: {
        plannedSchemaId: BENCHMARK_SCHEMA_ID,
        result: { type: "rounds_reps", rounds: 18, reps: 7 },
      },
    });
  });

  it("never carries the benchmark result through Mark Completed (Must-Test 15)", async () => {
    setSession(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon")]));

    await renderSession();

    fireEvent.click(screen.getByRole("button", { name: /log your result/i }));
    fireEvent.change(screen.getByLabelText(/rounds/i), { target: { value: "18" } });
    fireEvent.change(screen.getByLabelText(/^reps$/i), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /save result/i }));

    expect(createPerformedSessionAsync).not.toHaveBeenCalled();
  });

  it("keeps the in-schema editor open and retains the draft when the log mutation rejects (Must-Test 18)", async () => {
    logBenchmarkMutate.mockImplementation(() => {});
    setSession(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon")]));

    await renderSession();

    fireEvent.click(screen.getByRole("button", { name: /log your result/i }));
    fireEvent.change(screen.getByLabelText(/rounds/i), { target: { value: "18" } });
    fireEvent.change(screen.getByLabelText(/^reps$/i), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /save result/i }));

    expect(screen.getByRole("button", { name: /save result/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/rounds/i)).toHaveValue(18);
    expect(screen.getByLabelText(/^reps$/i)).toHaveValue(7);
  });

  it("logs a load benchmark and still opens the max sheet from the same card (Must-Test 19)", async () => {
    setSession(
      buildResponse([block(loadBenchmarkSchema, "clz0000000000000000000blk4", "Strength")]),
    );

    await renderSession();

    fireEvent.click(screen.getByRole("button", { name: /log your result/i }));
    fireEvent.change(screen.getByLabelText(/load \(kg\)/i), { target: { value: "142.5" } });
    fireEvent.click(screen.getByRole("button", { name: /save result/i }));

    expect(firstCallArg(logBenchmarkMutate)).toEqual({
      sessionId: SESSION_ID,
      data: {
        plannedSchemaId: BENCHMARK_SCHEMA_ID,
        result: { type: "load", kg: 142.5 },
      },
    });

    fireEvent.click(chip("100%, Set your max"));

    expect(await screen.findByLabelText("New 1RM (kg)")).toBeInTheDocument();
    expect(createOneRmMock).not.toHaveBeenCalled();
  });
});

describe("AthleteSessionView — Mark Completed (decoupled)", () => {
  it("creates one performed-session with no results key for an ordinary session (Must-Test 16)", async () => {
    setSession(maxSession(MISSING_ONE_RM));

    const container = await renderSession();

    fireEvent.click(within(getRail(container)).getByRole("button", { name: /mark completed/i }));

    await waitFor(() => expect(createPerformedSessionAsync).toHaveBeenCalledTimes(1));

    const arg = firstCallArg(createPerformedSessionAsync);

    expect(arg).toMatchObject({
      sessionId: SESSION_ID,
      athleteNotes: null,
      performedAt: expect.any(Date),
    });
    expect(arg).not.toHaveProperty("results");
  });

  it("completes with zero benchmarks logged and never posts a result (Must-Test 16)", async () => {
    setSession(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon")]));

    const container = await renderSession();

    fireEvent.click(within(getRail(container)).getByRole("button", { name: /mark completed/i }));

    await waitFor(() => expect(createPerformedSessionAsync).toHaveBeenCalledTimes(1));

    expect(firstCallArg(createPerformedSessionAsync)).not.toHaveProperty("results");
    expect(logBenchmarkMutate).not.toHaveBeenCalled();
  });

  it("enables Mark Completed without filling any benchmark (Must-Test 17)", async () => {
    setSession(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon")]));

    const container = await renderSession();

    expect(
      within(getRail(container)).getByRole("button", { name: /mark completed/i }),
    ).not.toBeDisabled();
  });

  it("echoes a logged and an unlogged benchmark in the ready card and stays enabled (Must-Test 21)", async () => {
    const logged: SchemaCardView = {
      ...benchmarkSchema,
      schemaId: "clz000000000000000000sch9",
      existingResult: { type: "rounds_reps", rounds: 18, reps: 7 },
    };

    setSession(
      buildResponse([
        block(logged, "clz0000000000000000000blk4", "Metcon"),
        block(benchmarkSchema, "clz0000000000000000000blk5", "Metcon 2"),
      ]),
    );

    const container = await renderSession();
    const rail = getRail(container);

    expect(within(rail).getByText(/· logged/i)).toBeInTheDocument();
    expect(within(rail).getByText(/isn't logged yet/i)).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: /mark completed/i })).not.toBeDisabled();
  });
});

describe("AthleteSessionView — done and re-open", () => {
  it("shows the done card with Re-open and no confirm when the session is done", async () => {
    setSession(
      buildResponse([block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon")], {
        done: true,
        completedAt: new Date("2026-06-18T12:00:00.000Z"),
      }),
    );

    await renderSession();

    expect(screen.getAllByRole("button", { name: /re-open/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
  });

  it("flips back to the logging form when Re-open is pressed", async () => {
    setSession(
      buildResponse([block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon")], {
        done: true,
        completedAt: new Date("2026-06-18T12:00:00.000Z"),
      }),
    );

    await renderSession();

    fireEvent.click(lastElement(screen.getAllByRole("button", { name: /re-open/i })));

    expect(screen.getAllByRole("button", { name: /mark completed/i }).length).toBeGreaterThan(0);
  });

  it("echoes a logged benchmark on both the schema card and the done card (Must-Test 20)", async () => {
    const logged: SchemaCardView = {
      ...benchmarkSchema,
      existingResult: { type: "rounds_reps", rounds: 18, reps: 7 },
    };

    setSession(
      buildResponse([block(logged, "clz0000000000000000000blk4", "Metcon")], {
        done: true,
        completedAt: new Date("2026-06-18T12:00:00.000Z"),
      }),
    );

    const container = await renderSession();

    expect(screen.getAllByText("18 rounds + 7 reps").length).toBeGreaterThan(1);
    expect(within(getRail(container)).getByText(/· logged/i)).toBeInTheDocument();
    expect(within(getRail(container)).getByText("18 rounds + 7 reps")).toBeInTheDocument();
  });
});
