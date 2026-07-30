import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type GetAthleteProfileResponse,
  HealthStatus,
} from "@repo/contracts/coaching/athlete-profile";
import { type Load } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type BlockView,
  type ResolvedLoad,
  type ResolvedLoadSource,
  type RowView,
  type SchemaCardView,
  type SessionDetailResponse,
} from "@repo/contracts/lms/session-detail";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

const useAthleteSessionViewMock = vi.fn();
const useAthleteProfileMock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useAthleteSessionView: (sessionId: string) => useAthleteSessionViewMock(sessionId),
    useAthleteProfile: () => useAthleteProfileMock(),
  };
});

const { AthleteSessionView } = await import("./athlete-session-view");

const SESSION_ID = "clz000000000000000000sess1";
const EX_ID = "clz0000000000000000000ex01";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const GENDER_AXIS_ID = "clz00000000000000000axs03";

const LONG_COORD =
  "Advanced masters competitor scaling to a much lighter bell whenever the right shoulder flares midway";

const PROFILE: GetAthleteProfileResponse = {
  id: "clz000000000000000000prf1",
  userId: "clz000000000000000000usr1",
  image: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  profileSelections: {},
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

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

const plainBlock = (blockId: string, label: string, schema: SchemaCardView): BlockView => ({
  blockId,
  label,
  intensity: null,
  note: null,
  items: [{ kind: "schema", schema }],
});

const singleAxisLoad = (axisId: string, first: string): Load => ({
  kind: "byProfile",
  axes: [{ axisId, label: "Level", values: [first, "Scaled"], binding: null }],
  cells: [
    { coords: [first], kg: 24 },
    { coords: ["Scaled"], kg: 16 },
  ],
});

const twoAxisLoad: Load = {
  kind: "byProfile",
  axes: [
    { axisId: LEVEL_AXIS_ID, label: "Level", values: ["RX", "Scaled"], binding: null },
    { axisId: SCALE_AXIS_ID, label: "Scale", values: ["M", "F"], binding: null },
  ],
  cells: [
    { coords: ["RX", "M"], kg: 60 },
    { coords: ["RX", "F"], kg: 42 },
    { coords: ["Scaled", "M"], kg: 45 },
    { coords: ["Scaled", "F"], kg: 30 },
  ],
};

const genderLoad: Load = {
  kind: "byProfile",
  axes: [
    { axisId: GENDER_AXIS_ID, label: "Gender", values: ["Male", "Female"], binding: "GENDER" },
  ],
  cells: [
    { coords: ["Male"], kg: 9 },
    { coords: ["Female"], kg: 6 },
  ],
};

const percentageLoad: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

const rangeLoad: Load = {
  kind: "percentage",
  value: 70,
  rangeMax: 80,
  reference: { scope: "self" },
};

const profileSource = (value: string): ResolvedLoadSource => ({
  kind: "profile",
  coords: [
    { axisId: LEVEL_AXIS_ID, label: "Level", value, binding: null },
    { axisId: GENDER_AXIS_ID, label: "Gender", value: "Female", binding: "GENDER" },
  ],
});

const oneRmSource = (percentMax?: number): ResolvedLoadSource => ({
  kind: "one_rm",
  exerciseId: EX_ID,
  percent: percentMax === undefined ? 80 : 70,
  ...(percentMax !== undefined && { percentMax }),
  baseKg: 120,
  recordedAt: "2026-07-12T10:00:00.000Z",
  recordSource: OneRMRecordSource.MANUAL,
});

const MISSING_ONE_RM: ResolvedLoad = {
  status: "unresolved",
  reason: "missing_one_rm",
  prompt: "set_one_rm",
  exerciseId: EX_ID,
};

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
            row: row("clz000000000000000000row1", "Back Squat", {
              sets: 5,
              reps: { kind: "count", value: 3 },
              load: percentageLoad,
              resolvedLoad: MISSING_ONE_RM,
              intensity: { effortPercent: { value: 70 } },
              tempo: { eccentric: 3, pauseBottom: 0, concentric: "X", pauseTop: 1 },
            }),
          },
          {
            kind: "row",
            row: row("clz000000000000000000row2", "Back-Rack Lunge", {
              reps: { kind: "count", value: 8 },
              load: { kind: "absolute", count: 2, kg: 24 },
              resolvedLoad: { status: "resolved", kg: 24, perHand: true },
              side: { kind: "each_leg" },
            }),
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
            row: row("clz000000000000000000row3", "Power Clean", {
              reps: { kind: "count", value: 3 },
              load: twoAxisLoad,
              resolvedLoad: {
                status: "unresolved",
                reason: "missing_profile_pick",
                prompt: "pick_profile",
                axisLabels: ["Level", "Scale"],
              },
            }),
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
      label: null,
      members: [
        row("clz000000000000000000row4", "Pull-Up", {
          reps: { kind: "count", value: 5 },
          load: { kind: "bodyweight" },
          resolvedLoad: { status: "bodyweight" },
        }),
        row("clz000000000000000000row5", "Ring Row", {
          reps: { kind: "count", value: 5 },
          load: { kind: "bodyweight" },
          resolvedLoad: { status: "bodyweight" },
        }),
      ],
    },
    {
      kind: "row",
      row: row("clz000000000000000000row6", "Air Squat", {
        reps: { kind: "count", value: 15 },
        load: { kind: "bodyweight" },
        resolvedLoad: { status: "bodyweight" },
      }),
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
                row: row("clz000000000000000000row7", "Strict Pull-Up", {
                  load: { kind: "bodyweight" },
                  resolvedLoad: { status: "bodyweight" },
                }),
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
                row: row("clz000000000000000000row8", "Ring Dip", {
                  load: { kind: "bodyweight" },
                  resolvedLoad: { status: "bodyweight" },
                }),
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

const resolvedBlock = (): BlockView =>
  plainBlock(
    "clz0000000000000000000blk5",
    "Resolved",
    plainSchema("clz000000000000000000sch6", "Resolved", [
      {
        kind: "row",
        row: row("clz00000000000000000row10", "DB Snatch", {
          load: singleAxisLoad(LEVEL_AXIS_ID, "RX"),
          resolvedLoad: { status: "resolved", kg: 24, perHand: false, source: profileSource("RX") },
        }),
      },
      {
        kind: "row",
        row: row("clz00000000000000000row11", "Front Squat", {
          load: percentageLoad,
          resolvedLoad: { status: "resolved", kg: 96, perHand: false, source: oneRmSource() },
        }),
      },
      {
        kind: "row",
        row: row("clz00000000000000000row12", "Push Press", {
          load: rangeLoad,
          resolvedLoad: { status: "resolved", kg: 84, perHand: false, source: oneRmSource(80) },
        }),
      },
      {
        kind: "row",
        row: row("clz00000000000000000row13", "Deadlift", {
          load: percentageLoad,
          resolvedLoad: { status: "resolved", kg: 100, perHand: false },
        }),
      },
    ]),
  );

const promptBlock = (): BlockView =>
  plainBlock(
    "clz0000000000000000000blk6",
    "Prompts",
    plainSchema("clz000000000000000000sch7", "Prompts", [
      {
        kind: "row",
        row: row("clz00000000000000000row14", "Kettlebell Swing", {
          load: singleAxisLoad(LEVEL_AXIS_ID, "RX"),
          resolvedLoad: {
            status: "unresolved",
            reason: "missing_profile_pick",
            prompt: "pick_profile",
            axisLabels: ["Level"],
          },
        }),
      },
      {
        kind: "row",
        row: row("clz00000000000000000row15", "Wall Ball", {
          load: genderLoad,
          resolvedLoad: {
            status: "unresolved",
            reason: "missing_profile_attribute",
            prompt: "set_profile_attribute",
            attribute: "gender",
            axisLabels: ["Gender"],
          },
        }),
      },
      {
        kind: "row",
        row: row("clz00000000000000000row16", "Sled Push", {
          load: { kind: "absolute", count: 1, kg: 40 },
          resolvedLoad: { status: "resolved", kg: 40, perHand: false },
        }),
      },
    ]),
  );

const longCoordGroupBlock = (): BlockView =>
  plainBlock(
    "clz0000000000000000000blk7",
    "Kettlebell Complex",
    plainSchema("clz000000000000000000sch8", "Kettlebell Complex", [
      {
        kind: "group",
        label: null,
        members: [
          row("clz00000000000000000row17", "1-arm KB overhead walking lunges", {
            reps: { kind: "count", value: 18 },
            load: singleAxisLoad(LEVEL_AXIS_ID, LONG_COORD),
            resolvedLoad: {
              status: "unresolved",
              reason: "missing_profile_pick",
              prompt: "pick_profile",
              axisLabels: ["Level"],
            },
          }),
          row("clz00000000000000000row18", "KB front rack hold", {
            reps: { kind: "count", value: 12 },
            load: singleAxisLoad(LEVEL_AXIS_ID, LONG_COORD),
            resolvedLoad: {
              status: "resolved",
              kg: 24,
              perHand: false,
              source: {
                kind: "profile",
                coords: [
                  { axisId: LEVEL_AXIS_ID, label: "Level", value: LONG_COORD, binding: null },
                ],
              },
            },
          }),
        ],
      },
    ]),
  );

const withBlocks = (blocks: BlockView[]): SessionDetailResponse => ({
  ...buildResponse(),
  blocks,
});

const setView = (response: SessionDetailResponse): void => {
  useAthleteSessionViewMock.mockReturnValue({ data: response, isLoading: false, error: null });
};

const chip = (name: string): HTMLElement => screen.getByRole("button", { name });

const LONG_PROMPT_CHIP = `${LONG_COORD}: 24 / Scaled: 16 kg, Pick your level`;
const LONG_RESOLVED_CHIP = `24 kg, ${LONG_COORD}, change`;

beforeEach(() => {
  vi.clearAllMocks();
  useAthleteProfileMock.mockReturnValue({ data: PROFILE });
});

describe("AthleteSessionView — session chrome", () => {
  it("renders the plan title, position eyebrow, workout title and date summary", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getAllByText("Performance RX").length).toBeGreaterThan(0);
    expect(screen.getByText("Week 3 · Day 4 · Performance RX")).toBeInTheDocument();
    expect(screen.getByText("Heavy Back Squat + Cindy")).toBeInTheDocument();
    expect(screen.getByText("Thursday 18")).toBeInTheDocument();
  });

  it("renders the benchmark chip and the logged result strip for a benchmark schema", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Rounds + Reps")).toBeInTheDocument();
    expect(screen.getByText("Your result")).toBeInTheDocument();
    expect(screen.getAllByText("18 rounds + 7 reps").length).toBeGreaterThan(1);
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

describe("AthleteSessionView — the sourced-weight chip", () => {
  it("prompts for a max on a percentage row with no record behind it", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(chip("80%, Set your max")).toBeInTheDocument();
    expect(screen.queryByText("80% of 1RM")).not.toBeInTheDocument();
  });

  it("reads a two-axis spread as a range and asks for the level", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(chip("30–60 kg, Pick your level")).toBeInTheDocument();
  });

  it("spells out both coordinates of an unpicked single-axis row (D-O)", () => {
    setView(withBlocks([promptBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(chip("RX: 24 / Scaled: 16 kg, Pick your level")).toBeInTheDocument();
  });

  it("derives the prompt from the axis label on a gender-bound row", () => {
    setView(withBlocks([promptBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(chip("Male: 9 / Female: 6 kg, Pick your gender")).toBeInTheDocument();
    expect(screen.queryByText(/sex/i)).not.toBeInTheDocument();
  });

  it("names the coordinates behind a weight the profile resolved", () => {
    setView(withBlocks([resolvedBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(chip("24 kg, RX · Female, change")).toBeInTheDocument();
  });

  it("names the percentage and the base behind a weight a record resolved", () => {
    setView(withBlocks([resolvedBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(chip("96 kg, 80% of 120, change")).toBeInTheDocument();
  });

  it("renders the authored range beside the number the resolver picked (D-G)", () => {
    setView(withBlocks([resolvedBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(chip("84 kg, 70–80% of 120, change")).toBeInTheDocument();
  });

  it("degrades a resolved payload with no source to a bare number", () => {
    setView(withBlocks([resolvedBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const bare = screen.getByText("100 kg");

    expect(bare.tagName).toBe("SPAN");
    expect(screen.queryByRole("button", { name: /100 kg/ })).not.toBeInTheDocument();
  });

  it("renders bodyweight rows under the bodyweight idiom", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getAllByText("Bodyweight").length).toBeGreaterThan(0);
  });
});

describe("AthleteSessionView — an authored absolute", () => {
  it("renders a paired absolute as a bare 2x value with nothing to open", () => {
    setView(buildResponse());

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const value = screen.getByText("2x24 kg");

    expect(value).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button", { name: /2x24 kg/ })).not.toBeInTheDocument();

    fireEvent.click(value);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a single absolute as a bare value with no tab stop", () => {
    setView(withBlocks([promptBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const value = screen.getByText("40 kg");

    expect(value).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button", { name: /40 kg/ })).not.toBeInTheDocument();

    fireEvent.click(value);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("AthleteSessionView — wrap behaviour (W1 regression, 3c397a7a)", () => {
  it("keeps the plain row right-aligned and wrapping", () => {
    setView(withBlocks([promptBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const outerRow = screen.getByText("Kettlebell Swing").parentElement?.parentElement;

    expect(outerRow).toHaveStyle({ justifyContent: "flex-end", flexWrap: "wrap" });
    expect(outerRow).toHaveStyle({ minWidth: "0px" });
  });

  it("keeps the plain row's load cluster shrinkable and never pinned to one line", () => {
    setView(withBlocks([promptBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const cluster = chip("RX: 24 / Scaled: 16 kg, Pick your level").parentElement;

    expect(cluster).toHaveStyle({ flex: "0 1 auto", minWidth: "0px" });
    expect(cluster).toHaveStyle({ flexWrap: "wrap", justifyContent: "flex-end" });
    expect(cluster).not.toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("lets an unpicked spread wrap instead of refusing to break", () => {
    setView(withBlocks([promptBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const value = screen.getByText("RX: 24 / Scaled: 16 kg");

    expect(value).toHaveStyle({ overflowWrap: "anywhere", minWidth: "0px" });
    expect(value).not.toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("keeps a resolved number on one line", () => {
    setView(withBlocks([resolvedBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("24 kg")).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("keeps the grouped member row right-aligned and wrapping", () => {
    setView(withBlocks([longCoordGroupBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const memberRow = chip(LONG_PROMPT_CHIP).parentElement?.parentElement;

    expect(memberRow).toHaveStyle({ justifyContent: "flex-end", flexWrap: "wrap" });
    expect(memberRow).toHaveStyle({ gap: "12px" });
  });

  it("lets the grouped movement absorb the free width", () => {
    setView(withBlocks([longCoordGroupBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("1-arm KB overhead walking lunges").parentElement).toHaveStyle({
      flex: "1 1 auto",
      minWidth: "0px",
    });
  });

  it("wraps the grouped metric cluster as a whole instead of compressing it", () => {
    setView(withBlocks([longCoordGroupBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const cluster = chip(LONG_PROMPT_CHIP).parentElement;

    expect(cluster).toHaveStyle({ minWidth: "0px", overflowWrap: "anywhere", flexWrap: "wrap" });
    expect(cluster).not.toHaveStyle({ whiteSpace: "nowrap" });
    expect(within(cluster ?? document.body).getByText("18 reps")).toBeInTheDocument();
  });
});

describe("AthleteSessionView — a 100-character coordinate inside a superset", () => {
  it("ellipsizes the source to the narrow max width without shortening what is read aloud", () => {
    setView(withBlocks([longCoordGroupBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const source = within(chip(LONG_RESOLVED_CHIP)).getByText(LONG_COORD);

    expect(source).toHaveStyle({
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "118px",
    });
    expect(source.textContent).toHaveLength(LONG_COORD.length);
  });

  it("keeps the chevron out of the narrowest layout", () => {
    setView(withBlocks([longCoordGroupBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const chevron = within(chip(LONG_RESOLVED_CHIP)).getByTestId("UnfoldMoreRoundedIcon");

    expect(chevron).toHaveStyle({ display: "none" });
    expect(chevron).toHaveAttribute("aria-hidden", "true");
  });

  it("lets the unpicked spread wrap while the volume keeps its own line", () => {
    setView(withBlocks([longCoordGroupBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    const value = screen.getByText(`${LONG_COORD}: 24 / Scaled: 16 kg`);

    expect(value).toHaveStyle({ overflowWrap: "anywhere" });
    expect(value).not.toHaveStyle({ whiteSpace: "nowrap" });
    expect(value.parentElement?.parentElement).toHaveStyle({ flexWrap: "wrap" });
  });

  it("reads the whole coordinate in the sheet once the chip is tapped", () => {
    setView(withBlocks([longCoordGroupBlock()]));

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    fireEvent.click(chip(LONG_PROMPT_CHIP));

    const option = screen.getByRole("radio", { name: LONG_COORD });

    expect(within(option).getByText(LONG_COORD)).toHaveStyle({ wordBreak: "break-word" });
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
          plainBlock(
            "clz0000000000000000000blk1",
            "Strength",
            plainSchema("clz000000000000000000sch1", "Back Squat", []),
          ),
        ],
      }),
    );

    render(<AthleteSessionView sessionId={SESSION_ID} />);

    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });
});
