import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type BlockView,
  type SchemaCardView,
  type SessionDetailResponse,
} from "@repo/contracts/lms/session-detail";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const useAthleteSessionViewMock = vi.fn();
const useAthleteProfileMock = vi.fn();
const createOneRmMutate = vi.fn();
const updateProfileMutate = vi.fn();
const createPerformedSessionAsync = vi.fn();
const logBenchmarkMutate = vi.fn();

let createOneRmPending = false;
let updateProfilePending = false;

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useAthleteSessionView: (sessionId: string) => useAthleteSessionViewMock(sessionId),
    useAthleteProfile: () => useAthleteProfileMock(),
    useCreateOneRMRecord: () => ({ mutate: createOneRmMutate, isPending: createOneRmPending }),
    useUpdateAthleteProfile: () => ({
      mutate: updateProfileMutate,
      isPending: updateProfilePending,
    }),
    useCreatePerformedSession: () => ({
      mutateAsync: createPerformedSessionAsync,
      isPending: false,
    }),
    useLogBenchmarkResult: () => ({ mutate: logBenchmarkMutate, isPending: false }),
  };
});

const { AthleteSessionView } = await import("./athlete-session-view");

const SESSION_ID = "clz000000000000000000sess1";
const PERFORMED_ID = "clz00000000000000000perf01";
const EX_ID = "clz0000000000000000000ex01";
const ONE_RM_SCHEMA_ID = "clz000000000000000000sch1";
const PROFILE_SCHEMA_ID = "clz000000000000000000sch2";
const BENCHMARK_SCHEMA_ID = "clz000000000000000000sch3";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";

const oneRmRow: SchemaCardView = {
  schemaId: ONE_RM_SCHEMA_ID,
  header: "Back Squat",
  composition: { repetition: { kind: "count", count: 5 } },
  label: { kind: "rounds", family: "ROUNDS" },
  isBenchmark: false,
  resultType: null,
  intensity: null,
  existingResult: null,
  items: [
    {
      kind: "row",
      row: {
        rowId: "clz000000000000000000row1",
        movement: "Back Squat",
        media: null,
        sets: 5,
        reps: { kind: "count", value: 3 },
        load: { kind: "percentage", value: 80, reference: { scope: "self" } },
        resolvedLoad: {
          status: "unresolved",
          reason: "missing_one_rm",
          prompt: "set_one_rm",
          exerciseId: EX_ID,
        },
        intensity: null,
        tempo: null,
        side: null,
        rest: null,
        modifiers: [],
        notes: null,
      },
    },
  ],
};

const profileRow: SchemaCardView = {
  schemaId: PROFILE_SCHEMA_ID,
  header: "Power Clean",
  composition: { repetition: { kind: "count", count: 3 } },
  label: { kind: "rounds", family: "ROUNDS" },
  isBenchmark: false,
  resultType: null,
  intensity: null,
  existingResult: null,
  items: [
    {
      kind: "row",
      row: {
        rowId: "clz000000000000000000row2",
        movement: "Power Clean",
        media: null,
        sets: null,
        reps: { kind: "count", value: 3 },
        load: {
          kind: "byProfile",
          axes: [
            { kind: "catalog", axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"] },
            { kind: "catalog", axisId: SCALE_AXIS_ID, label: "Scale", values: ["M", "F"] },
          ],
          cells: [
            { coords: ["RX", "M"], kg: 60 },
            { coords: ["RX", "F"], kg: 42 },
            { coords: ["Scaled", "M"], kg: 45 },
            { coords: ["Scaled", "F"], kg: 30 },
          ],
        },
        resolvedLoad: {
          status: "unresolved",
          reason: "missing_profile_pick",
          prompt: "pick_profile",
          axisLabels: ["Level", "Scale"],
        },
        intensity: null,
        tempo: null,
        side: null,
        rest: null,
        modifiers: [],
        notes: null,
      },
    },
  ],
};

const humanProfileRow: SchemaCardView = {
  schemaId: "clz000000000000000000sch5",
  header: "Wall Ball",
  composition: { repetition: { kind: "count", count: 3 } },
  label: { kind: "rounds", family: "ROUNDS" },
  isBenchmark: false,
  resultType: null,
  intensity: null,
  existingResult: null,
  items: [
    {
      kind: "row",
      row: {
        rowId: "clz000000000000000000row9",
        movement: "Wall Ball",
        media: null,
        sets: null,
        reps: { kind: "count", value: 3 },
        load: {
          kind: "byProfile",
          axes: [{ kind: "human", attribute: "gender" }],
          cells: [
            { coords: ["Male"], kg: 9 },
            { coords: ["Female"], kg: 6 },
          ],
        },
        resolvedLoad: {
          status: "unresolved",
          reason: "missing_profile_attribute",
          prompt: "set_profile_attribute",
          attribute: "gender",
          axisLabels: ["Gender"],
        },
        intensity: null,
        tempo: null,
        side: null,
        rest: null,
        modifiers: [],
        notes: null,
      },
    },
  ],
};

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
      row: {
        rowId: "clz000000000000000000row3",
        movement: "Air Squat",
        media: null,
        sets: null,
        reps: { kind: "count", value: 15 },
        load: { kind: "bodyweight" },
        resolvedLoad: { status: "bodyweight" },
        intensity: null,
        tempo: null,
        side: null,
        rest: null,
        modifiers: [],
        notes: null,
      },
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
      row: {
        rowId: "clz000000000000000000row4",
        movement: "Back Squat",
        media: null,
        sets: 1,
        reps: { kind: "count", value: 1 },
        load: { kind: "percentage", value: 100, reference: { scope: "self" } },
        resolvedLoad: {
          status: "unresolved",
          reason: "missing_one_rm",
          prompt: "set_one_rm",
          exerciseId: EX_ID,
        },
        intensity: null,
        tempo: null,
        side: null,
        rest: null,
        modifiers: [],
        notes: null,
      },
    },
  ],
};

const block = (schema: SchemaCardView, blockId: string, label: string): BlockView => ({
  blockId,
  label,
  intensity: null,
  note: null,
  items: [{ kind: "schema", schema }],
});

const buildResponse = (
  blocks: BlockView[],
  overrides: Partial<SessionDetailResponse["session"]> = {},
): SessionDetailResponse => ({
  session: {
    sessionId: SESSION_ID,
    planTitle: "Performance RX",
    position: "Week 3 · Day 4 · Performance RX",
    title: "Workout",
    dayOfWeek: "THURSDAY",
    dayOfMonth: 18,
    summary: "1 block",
    done: false,
    completedAt: null,
    ...overrides,
  },
  blocks,
});

const setView = (response: SessionDetailResponse): void => {
  useAthleteSessionViewMock.mockReturnValue({ data: response, isLoading: false, error: null });
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

const lastElement = (elements: HTMLElement[]): HTMLElement => {
  const element = elements[elements.length - 1];

  if (element === undefined) {
    throw new Error("expected at least one element");
  }

  return element;
};

const setProfile = (profileSelections: Record<string, string> | null): void => {
  useAthleteProfileMock.mockReturnValue({ data: { profileSelections } });
};

beforeEach(() => {
  vi.clearAllMocks();
  createOneRmPending = false;
  updateProfilePending = false;
  setProfile(null);
  createPerformedSessionAsync.mockResolvedValue({ id: PERFORMED_ID });
});

describe("AthleteSessionView — inline Set 1RM", () => {
  it("posts a MANUAL one-rm record with the parsed value on Set", () => {
    setView(buildResponse([block(oneRmRow, "clz0000000000000000000blk1", "Strength")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /set 1rm/i }));
    fireEvent.change(screen.getByLabelText(/estimated 1rm/i), { target: { value: "140" } });
    fireEvent.click(screen.getByRole("button", { name: /^set$/i }));

    expect(createOneRmMutate).toHaveBeenCalledTimes(1);
    expect(firstCallArg(createOneRmMutate)).toMatchObject({
      exerciseId: EX_ID,
      valueKg: 140,
      source: OneRMRecordSource.MANUAL,
      recordedAt: expect.any(Date),
    });
  });

  it("keeps the Set button disabled for a non-positive value", () => {
    setView(buildResponse([block(oneRmRow, "clz0000000000000000000blk1", "Strength")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /set 1rm/i }));
    fireEvent.change(screen.getByLabelText(/estimated 1rm/i), { target: { value: "0" } });

    expect(screen.getByRole("button", { name: /^set$/i })).toBeDisabled();
  });

  it("rejects a negative 1rm by disabling Set rather than blocking the keystroke (QA-010)", () => {
    setView(buildResponse([block(oneRmRow, "clz0000000000000000000blk1", "Strength")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /set 1rm/i }));

    const input = screen.getByLabelText(/estimated 1rm/i);

    fireEvent.change(input, { target: { value: "-5" } });

    expect(input).toHaveValue(-5);
    expect(screen.getByRole("button", { name: /^set$/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^set$/i }));

    expect(createOneRmMutate).not.toHaveBeenCalled();
  });

  it("does not submit the one-rm twice while its mutation is pending (QA-002)", () => {
    createOneRmPending = true;
    setView(buildResponse([block(oneRmRow, "clz0000000000000000000blk1", "Strength")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /set 1rm/i }));
    fireEvent.change(screen.getByLabelText(/estimated 1rm/i), { target: { value: "140" } });

    const setButton = screen.getByRole("button", { name: /^set$/i });

    expect(setButton).toBeDisabled();

    fireEvent.click(setButton);
    fireEvent.click(setButton);

    expect(createOneRmMutate).not.toHaveBeenCalled();
  });
});

describe("AthleteSessionView — inline Pick profile", () => {
  it("merges the new pick with existing selections without clobbering other axes", () => {
    setProfile({ [SCALE_AXIS_ID]: "M" });
    setView(buildResponse([block(profileRow, "clz0000000000000000000blk2", "Power")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /pick your/i }));
    fireEvent.click(screen.getByRole("button", { name: "Scaled" }));

    expect(updateProfileMutate).toHaveBeenCalledTimes(1);
    expect(firstCallArg(updateProfileMutate)).toEqual({
      profileSelections: { [SCALE_AXIS_ID]: "M", [LEVEL_AXIS_ID]: "Scaled" },
    });
  });

  it("pre-selects an axis value already in the athlete profile", () => {
    setProfile({ [LEVEL_AXIS_ID]: "RX" });
    setView(buildResponse([block(profileRow, "clz0000000000000000000blk2", "Power")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /pick your/i }));

    expect(screen.getByRole("button", { name: "RX" })).toHaveClass("MuiButton-contained");
  });

  it("stages a partial pick and PUTs once when every axis is chosen (QA-003)", () => {
    setView(buildResponse([block(profileRow, "clz0000000000000000000blk2", "Power")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /pick your/i }));
    fireEvent.click(screen.getByRole("button", { name: "RX" }));

    expect(updateProfileMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "RX" })).toHaveClass("MuiButton-contained");

    fireEvent.click(screen.getByRole("button", { name: "M" }));

    expect(updateProfileMutate).toHaveBeenCalledTimes(1);
    expect(firstCallArg(updateProfileMutate)).toEqual({
      profileSelections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
    });
  });

  it("does not submit the profile twice while its mutation is pending (QA-002)", () => {
    updateProfilePending = true;
    setProfile({ [SCALE_AXIS_ID]: "M" });
    setView(buildResponse([block(profileRow, "clz0000000000000000000blk2", "Power")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /pick your/i }));

    const scaled = screen.getByRole("button", { name: "Scaled" });

    expect(scaled).toBeDisabled();

    fireEvent.click(scaled);
    fireEvent.click(scaled);

    expect(updateProfileMutate).not.toHaveBeenCalled();
  });
});

describe("AthleteSessionView — human gender steer (no inline pick)", () => {
  it("shows the set-your-sex steer and never opens an inline pick for a gender-null human axis", () => {
    setView(buildResponse([block(humanProfileRow, "clz0000000000000000000blk5", "Power")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Set your sex in your profile")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pick your/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Male" })).not.toBeInTheDocument();
    expect(updateProfileMutate).not.toHaveBeenCalled();
  });
});

describe("AthleteSessionView — in-schema benchmark logging", () => {
  it("logs the benchmark result from its schema card in a single decoupled request (Must-Test 15)", () => {
    setView(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk3", "Metcon")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

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

  it("never carries the benchmark result through Mark Completed (Must-Test 15)", () => {
    setView(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk3", "Metcon")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /log your result/i }));
    fireEvent.change(screen.getByLabelText(/rounds/i), { target: { value: "18" } });
    fireEvent.change(screen.getByLabelText(/^reps$/i), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /save result/i }));

    expect(createPerformedSessionAsync).not.toHaveBeenCalled();
  });

  it("keeps the in-schema editor open and retains the draft when the log mutation rejects (Must-Test 18)", () => {
    logBenchmarkMutate.mockImplementation(() => {});
    setView(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk3", "Metcon")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(screen.getByRole("button", { name: /log your result/i }));
    fireEvent.change(screen.getByLabelText(/rounds/i), { target: { value: "18" } });
    fireEvent.change(screen.getByLabelText(/^reps$/i), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /save result/i }));

    expect(screen.getByRole("button", { name: /save result/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/rounds/i)).toHaveValue(18);
    expect(screen.getByLabelText(/^reps$/i)).toHaveValue(7);
  });

  it("logs a load benchmark as a load payload and coexists with the inline Set 1RM editor (Must-Test 19)", () => {
    setView(buildResponse([block(loadBenchmarkSchema, "clz0000000000000000000blk3", "Strength")]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

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

    fireEvent.click(screen.getByRole("button", { name: /set 1rm/i }));

    expect(screen.getByLabelText(/estimated 1rm/i)).toBeInTheDocument();
    expect(createOneRmMutate).not.toHaveBeenCalled();
  });
});

describe("AthleteSessionView — Mark Completed (decoupled)", () => {
  it("creates one performed-session with no results key for an ordinary session (Must-Test 16)", async () => {
    setView(buildResponse([block(oneRmRow, "clz0000000000000000000blk1", "Strength")]));

    const { container } = render(<AthleteSessionView sessionId={SESSION_ID} />);

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
    setView(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk3", "Metcon")]));

    const { container } = render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(within(getRail(container)).getByRole("button", { name: /mark completed/i }));

    await waitFor(() => expect(createPerformedSessionAsync).toHaveBeenCalledTimes(1));

    expect(firstCallArg(createPerformedSessionAsync)).not.toHaveProperty("results");
    expect(logBenchmarkMutate).not.toHaveBeenCalled();
  });

  it("enables Mark Completed without filling any benchmark (Must-Test 17)", () => {
    setView(buildResponse([block(benchmarkSchema, "clz0000000000000000000blk3", "Metcon")]));

    const { container } = render(<AthleteSessionView sessionId={SESSION_ID} />);
    const confirm = within(getRail(container)).getByRole("button", { name: /mark completed/i });

    expect(confirm).not.toBeDisabled();
  });

  it("echoes a logged and an unlogged benchmark in the ready card and stays enabled (Must-Test 21)", () => {
    const logged: SchemaCardView = {
      ...benchmarkSchema,
      schemaId: "clz000000000000000000sch9",
      existingResult: { type: "rounds_reps", rounds: 18, reps: 7 },
    };

    setView(
      buildResponse([
        block(logged, "clz0000000000000000000blk3", "Metcon"),
        block(benchmarkSchema, "clz0000000000000000000blk4", "Metcon 2"),
      ]),
    );

    const { container } = render(<AthleteSessionView sessionId={SESSION_ID} />);
    const rail = getRail(container);

    expect(within(rail).getByText(/· logged/i)).toBeInTheDocument();
    expect(within(rail).getByText(/isn't logged yet/i)).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: /mark completed/i })).not.toBeDisabled();
  });
});

describe("AthleteSessionView — done and re-open", () => {
  it("shows the done card with Re-open and no confirm when the session is done", () => {
    setView(
      buildResponse([block(oneRmRow, "clz0000000000000000000blk1", "Strength")], {
        done: true,
        completedAt: new Date("2026-06-18T12:00:00.000Z"),
      }),
    );

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getAllByRole("button", { name: /re-open/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /mark completed/i })).not.toBeInTheDocument();
  });

  it("flips back to the logging form when Re-open is pressed", () => {
    setView(
      buildResponse([block(oneRmRow, "clz0000000000000000000blk1", "Strength")], {
        done: true,
        completedAt: new Date("2026-06-18T12:00:00.000Z"),
      }),
    );

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const reopen = screen.getAllByRole("button", { name: /re-open/i });

    fireEvent.click(lastElement(reopen));

    expect(screen.getAllByRole("button", { name: /mark completed/i }).length).toBeGreaterThan(0);
  });

  it("echoes a logged benchmark on both the schema card and the done card (Must-Test 20)", () => {
    const logged: SchemaCardView = {
      ...benchmarkSchema,
      existingResult: { type: "rounds_reps", rounds: 18, reps: 7 },
    };

    setView(
      buildResponse([block(logged, "clz0000000000000000000blk3", "Metcon")], {
        done: true,
        completedAt: new Date("2026-06-18T12:00:00.000Z"),
      }),
    );

    const { container } = render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getAllByText("18 rounds + 7 reps").length).toBeGreaterThan(1);
    expect(within(getRail(container)).getByText(/· logged/i)).toBeInTheDocument();
    expect(within(getRail(container)).getByText("18 rounds + 7 reps")).toBeInTheDocument();
  });
});
