import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  type BlockView,
  type SchemaCardView,
  type SessionDetailResponse,
} from "@repo/contracts/lms/session-detail";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const useAthleteSessionViewMock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useAthleteSessionView: (sessionId: string) => useAthleteSessionViewMock(sessionId),
  };
});

const { AthleteSessionView } = await import("./athlete-session-view");

const SESSION_ID = "clz000000000000000000sess1";
const EX_ID = "clz0000000000000000000ex01";

const strengthBlock = (): BlockView => ({
  blockId: "clz0000000000000000000blk1",
  label: "Strength",
  intensity: { rpe: { value: 7 } },
  note: "Build gradually.",
  items: [
    {
      kind: "schema",
      schema: {
        schemaId: "clz000000000000000000sch1",
        header: "Back Squat",
        composition: {
          repetition: { kind: "count", count: 5 },
          rest: { duration: { value: 2, unit: "min" }, scope: "between_sets" },
        },
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
              intensity: { effortPercent: { value: 70 } },
              tempo: { eccentric: 3, pauseBottom: 0, concentric: "X", pauseTop: 1 },
              side: null,
              rest: null,
              modifiers: [],
              notes: null,
            },
          },
          {
            kind: "row",
            row: {
              rowId: "clz000000000000000000row2",
              movement: "Back-Rack Lunge",
              media: null,
              sets: null,
              reps: { kind: "count", value: 8 },
              load: { kind: "absolute", count: 2, kg: 24 },
              resolvedLoad: { status: "resolved", kg: 24, perHand: true },
              intensity: null,
              tempo: null,
              side: { kind: "each_leg" },
              rest: null,
              modifiers: [],
              notes: null,
            },
          },
        ],
      },
    },
  ],
});

const powerBlock = (): BlockView => ({
  blockId: "clz0000000000000000000blk2",
  label: "Power",
  intensity: null,
  note: null,
  items: [
    {
      kind: "schema",
      schema: {
        schemaId: "clz000000000000000000sch2",
        header: "Power Clean",
        composition: { repetition: { kind: "cadence", everyMin: 1, rounds: 10 } },
        label: { kind: "cadence", family: "INTERVALIC" },
        isBenchmark: false,
        resultType: null,
        intensity: null,
        existingResult: null,
        items: [
          {
            kind: "row",
            row: {
              rowId: "clz000000000000000000row3",
              movement: "Power Clean",
              media: null,
              sets: null,
              reps: { kind: "count", value: 3 },
              load: {
                kind: "byProfile",
                axes: [
                  { name: "Level", values: ["RX", "Scaled"] },
                  { name: "Sex", values: ["M", "F"] },
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
                axisNames: ["Level", "Sex"],
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
      },
    },
  ],
});

const benchmarkSchema = (): SchemaCardView => ({
  schemaId: "clz000000000000000000sch3",
  header: "Cindy",
  composition: {
    repetition: { kind: "timeCap", cap: { min: 20, unit: "min" } },
    benchmark: { resultType: "rounds_reps" },
  },
  label: { kind: "timeCap", family: "TIME_BOUNDED" },
  isBenchmark: true,
  resultType: "rounds_reps",
  intensity: null,
  existingResult: { type: "rounds_reps", rounds: 18, reps: 7 },
  items: [
    {
      kind: "group",
      members: [
        {
          rowId: "clz000000000000000000row4",
          movement: "Pull-Up",
          media: null,
          sets: null,
          reps: { kind: "count", value: 5 },
          load: { kind: "bodyweight" },
          resolvedLoad: { status: "not_applicable" },
          intensity: null,
          tempo: null,
          side: null,
          rest: null,
          modifiers: [],
          notes: null,
        },
        {
          rowId: "clz000000000000000000row5",
          movement: "Ring Row",
          media: null,
          sets: null,
          reps: { kind: "count", value: 5 },
          load: { kind: "bodyweight" },
          resolvedLoad: { status: "not_applicable" },
          intensity: null,
          tempo: null,
          side: null,
          rest: null,
          modifiers: [],
          notes: null,
        },
      ],
    },
    {
      kind: "row",
      row: {
        rowId: "clz000000000000000000row6",
        movement: "Air Squat",
        media: null,
        sets: null,
        reps: { kind: "count", value: 15 },
        load: { kind: "bodyweight" },
        resolvedLoad: { status: "not_applicable" },
        intensity: null,
        tempo: null,
        side: null,
        rest: null,
        modifiers: [],
        notes: null,
      },
    },
  ],
});

const gymnasticsBlock = (): BlockView => ({
  blockId: "clz0000000000000000000blk3",
  label: "Gymnastics",
  intensity: null,
  note: null,
  items: [
    {
      kind: "parallel-group",
      trackCount: 2,
      tracks: [
        {
          header: "Pull Ladder",
          schema: {
            schemaId: "clz000000000000000000sch4",
            header: "Pull Ladder",
            composition: { repetition: { kind: "ladder", steps: [1, 2, 3] } },
            label: { kind: "ladder", family: "LADDER" },
            isBenchmark: false,
            resultType: null,
            intensity: null,
            existingResult: null,
            items: [
              {
                kind: "row",
                row: {
                  rowId: "clz000000000000000000row7",
                  movement: "Strict Pull-Up",
                  media: null,
                  sets: null,
                  reps: null,
                  load: { kind: "bodyweight" },
                  resolvedLoad: { status: "not_applicable" },
                  intensity: null,
                  tempo: null,
                  side: null,
                  rest: null,
                  modifiers: [],
                  notes: null,
                },
              },
            ],
          },
        },
        {
          header: null,
          schema: {
            schemaId: "clz000000000000000000sch5",
            header: "Push Ladder",
            composition: { repetition: { kind: "ladder", steps: [3, 2, 1] } },
            label: { kind: "ladder", family: "LADDER" },
            isBenchmark: false,
            resultType: null,
            intensity: null,
            existingResult: null,
            items: [
              {
                kind: "row",
                row: {
                  rowId: "clz000000000000000000row8",
                  movement: "Ring Dip",
                  media: null,
                  sets: null,
                  reps: null,
                  load: { kind: "bodyweight" },
                  resolvedLoad: { status: "not_applicable" },
                  intensity: null,
                  tempo: null,
                  side: null,
                  rest: null,
                  modifiers: [],
                  notes: null,
                },
              },
            ],
          },
        },
      ],
    },
  ],
});

const buildResponse = (
  overrides: Partial<SessionDetailResponse["session"]> = {},
): SessionDetailResponse => ({
  session: {
    sessionId: SESSION_ID,
    planTitle: "Performance RX",
    position: "Week 3 · Day 4 · Performance RX",
    title: "Heavy Back Squat + Cindy",
    dayOfWeek: "THURSDAY",
    dayOfMonth: 18,
    summary: "4 blocks · 1 benchmark",
    done: false,
    completedAt: null,
    ...overrides,
  },
  blocks: [
    strengthBlock(),
    powerBlock(),
    {
      blockId: "clz0000000000000000000blk4",
      label: "Metcon · Benchmark",
      intensity: null,
      note: null,
      items: [{ kind: "schema", schema: benchmarkSchema() }],
    },
    gymnasticsBlock(),
  ],
});

const setView = (response: SessionDetailResponse): void => {
  useAthleteSessionViewMock.mockReturnValue({ data: response, isLoading: false, error: null });
};

describe("AthleteSessionView", () => {
  it("renders the plan title, position eyebrow, workout title and date summary", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getAllByText("Performance RX").length).toBeGreaterThan(0);
    expect(screen.getByText("Week 3 · Day 4 · Performance RX")).toBeInTheDocument();
    expect(screen.getByText("Heavy Back Squat + Cindy")).toBeInTheDocument();
    expect(screen.getByText("Thursday 18")).toBeInTheDocument();
  });

  it("renders the Set 1RM affordance with the percentage hint for a missing_one_rm row", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByRole("button", { name: /set 1rm/i })).toBeInTheDocument();
    expect(screen.getByText("80% of 1RM")).toBeInTheDocument();
  });

  it("renders the Pick profile affordance with the axes hint for a missing_profile_pick row", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByRole("button", { name: /pick profile/i })).toBeInTheDocument();
    expect(screen.getByText("RX/Scaled · M/F")).toBeInTheDocument();
  });

  it("renders a per-hand resolved load with its kg value and per-hand sub", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("24 kg / hand")).toBeInTheDocument();
  });

  it("renders bodyweight rows under the bodyweight idiom", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getAllByText("Bodyweight").length).toBeGreaterThan(0);
  });

  it("renders the benchmark chip and the logged result strip for a done benchmark schema", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Rounds + Reps")).toBeInTheDocument();
    expect(screen.getByText("Your result")).toBeInTheDocument();
    expect(screen.getByText("18 rounds + 7 reps")).toBeInTheDocument();
  });

  it("renders the shape badge wording from the composition summary", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("cap 20’")).toBeInTheDocument();
    expect(screen.getByText("EMOM 1’×10")).toBeInTheDocument();
  });

  it("renders a parallel group with its track count and a fallback track label", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Parallel · 2 tracks")).toBeInTheDocument();
    expect(screen.getByText("Track 2")).toBeInTheDocument();
  });

  it("renders the row group with a neutral group label (no fabricated choose-one)", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.queryByText(/choose one/i)).not.toBeInTheDocument();
  });

  it("shows the Mark Completed action and no Done pill when the session is not done", () => {
    setView(buildResponse({ done: false }));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getAllByRole("button", { name: /mark completed/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("shows the Done pill and Re-open action when the session is done", () => {
    setView(buildResponse({ done: true, completedAt: new Date("2026-06-18T12:00:00.000Z") }));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /re-open/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Logged June 18").length).toBeGreaterThan(0);
  });

  it("never renders a Today pill (today-detection deferred server-side)", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.queryByText("Today")).not.toBeInTheDocument();
  });
});

const emptySession = (overrides: Partial<SessionDetailResponse> = {}): SessionDetailResponse => ({
  session: {
    sessionId: SESSION_ID,
    planTitle: "Performance RX",
    position: "Week 3 · Day 4 · Performance RX",
    title: "Rest-ish",
    dayOfWeek: "THURSDAY",
    dayOfMonth: 18,
    summary: "0 blocks",
    done: false,
    completedAt: null,
  },
  blocks: [],
  ...overrides,
});

describe("AthleteSessionView — degenerate shapes", () => {
  it("renders the header and Mark Completed for an empty session with no blocks (U1)", () => {
    setView(emptySession());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Rest-ish")).toBeInTheDocument();
    expect(screen.getByText("Week 3 · Day 4 · Performance RX")).toBeInTheDocument();
    expect(screen.getByText("0 blocks")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /mark completed/i }).length).toBeGreaterThan(0);
  });

  it("renders a block whose items list is empty without crashing (U2)", () => {
    setView(
      emptySession({
        blocks: [
          {
            blockId: "clz0000000000000000000blk1",
            label: "Strength",
            intensity: null,
            note: null,
            items: [],
          },
        ],
      }),
    );

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /mark completed/i }).length).toBeGreaterThan(0);
  });

  it("renders a schema whose items list is empty without crashing (U3)", () => {
    setView(
      emptySession({
        blocks: [
          {
            blockId: "clz0000000000000000000blk1",
            label: "Strength",
            intensity: null,
            note: null,
            items: [
              {
                kind: "schema",
                schema: {
                  schemaId: "clz000000000000000000sch1",
                  header: "Back Squat",
                  composition: { repetition: { kind: "count", count: 5 } },
                  label: { kind: "rounds", family: "ROUNDS" },
                  isBenchmark: false,
                  resultType: null,
                  intensity: null,
                  existingResult: null,
                  items: [],
                },
              },
            ],
          },
        ],
      }),
    );

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });
});
