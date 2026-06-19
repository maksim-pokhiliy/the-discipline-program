import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type Result } from "@repo/contracts/lms/_shared";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type BenchmarkRecordView,
  type BenchmarkSeriesPoint,
  type OneRMRecordView,
} from "@repo/contracts/lms/records-view";

import { render } from "@app/test/render";

import { RecordCard } from "./record-card";

const SUCCESS_GREEN = "rgb(77, 183, 106)";
const ERROR_RED = "rgb(232, 84, 84)";

const oneRMRecord = (overrides: Partial<OneRMRecordView> = {}): OneRMRecordView => ({
  exerciseId: "clz0000000000000000000ex01",
  exerciseName: "Back Squat",
  best: 120,
  bestSource: OneRMRecordSource.TESTED,
  bestRecordedAt: "2026-02-01T00:00:00.000Z",
  lastRecordedAt: "2026-03-01T00:00:00.000Z",
  delta: 5,
  recordCount: 3,
  series: [
    {
      valueKg: 100,
      source: OneRMRecordSource.TESTED,
      recordedAt: "2026-01-01T00:00:00.000Z",
      isBest: false,
    },
    {
      valueKg: 120,
      source: OneRMRecordSource.TESTED,
      recordedAt: "2026-02-01T00:00:00.000Z",
      isBest: true,
    },
    {
      valueKg: 110,
      source: OneRMRecordSource.MANUAL,
      recordedAt: "2026-03-01T00:00:00.000Z",
      isBest: false,
    },
  ],
  ...overrides,
});

const benchmarkRecord = (overrides: Partial<BenchmarkRecordView> = {}): BenchmarkRecordView => ({
  plannedSchemaId: "clz000000000000000000sch1",
  title: "Fran",
  subline: "21-15-9 · Thruster 43kg / Pull-Up",
  resultType: "time",
  best: { type: "time", seconds: 150 },
  bestRecordedAt: "2026-02-10T00:00:00.000Z",
  lastRecordedAt: "2026-02-10T00:00:00.000Z",
  delta: { value: -30, improved: true },
  series: [
    {
      result: { type: "time", seconds: 180 },
      scalar: 180,
      recordedAt: "2026-01-10T00:00:00.000Z",
      isBest: false,
    },
    {
      result: { type: "time", seconds: 150 },
      scalar: 150,
      recordedAt: "2026-02-10T00:00:00.000Z",
      isBest: true,
    },
  ],
  attemptCount: 2,
  ...overrides,
});

const benchmarkSeriesOf = (best: Result, latest: Result): BenchmarkSeriesPoint[] => [
  { result: best, scalar: 0, recordedAt: "2026-01-10T00:00:00.000Z", isBest: true },
  { result: latest, scalar: 0, recordedAt: "2026-02-10T00:00:00.000Z", isBest: false },
];

const renderOneRm = (record: OneRMRecordView, isOpen = false): void => {
  render(
    <RecordCard
      kind="oneRM"
      record={record}
      isOpen={isOpen}
      onToggle={vi.fn()}
      onUpdateOneRm={vi.fn()}
    />,
  );
};

const renderBenchmark = (record: BenchmarkRecordView, isOpen = false): void => {
  render(
    <RecordCard
      kind="benchmark"
      record={record}
      isOpen={isOpen}
      onToggle={vi.fn()}
      onUpdateOneRm={vi.fn()}
    />,
  );
};

const trendUp = (): HTMLElement => screen.getByTestId("TrendingUpRoundedIcon");
const trendDown = (): HTMLElement => screen.getByTestId("TrendingDownRoundedIcon");

describe("RecordCard collapsed", () => {
  it("renders the name, best value, kg unit and the best date", () => {
    renderOneRm(oneRMRecord());

    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByText("Feb 2026")).toBeInTheDocument();
  });

  it("shows the all-time best (120) not the latest (110) for a de-load history", () => {
    renderOneRm(oneRMRecord({ best: 120, delta: -10 }));

    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.queryByText("110")).not.toBeInTheDocument();
  });

  it("does not render the history list while collapsed", () => {
    renderOneRm(oneRMRecord());

    expect(screen.queryByText("History")).not.toBeInTheDocument();
  });
});

describe("RecordCard trend orientation", () => {
  it("renders an up-green trend with a magnitude for a positive 1RM delta", () => {
    renderOneRm(oneRMRecord({ delta: 15 }));

    expect(trendUp()).toHaveStyle({ color: SUCCESS_GREEN });
    expect(screen.getByText("15 kg")).toBeInTheDocument();
  });

  it("renders a down-red trend with a magnitude for a de-load (negative) 1RM delta", () => {
    renderOneRm(oneRMRecord({ delta: -10 }));

    expect(trendDown()).toHaveStyle({ color: ERROR_RED });
    expect(screen.getByText("10 kg")).toBeInTheDocument();
  });

  it("renders an up-green trend with a magnitude for a faster-time benchmark PR", () => {
    renderBenchmark(
      benchmarkRecord({
        resultType: "time",
        best: { type: "time", seconds: 150 },
        delta: { value: -30, improved: true },
        series: benchmarkSeriesOf({ type: "time", seconds: 180 }, { type: "time", seconds: 150 }),
      }),
    );

    expect(trendUp()).toHaveStyle({ color: SUCCESS_GREEN });
    expect(screen.getByText("30 s")).toBeInTheDocument();
  });

  it("renders a down-red trend with a magnitude for a slower-time benchmark regression", () => {
    renderBenchmark(
      benchmarkRecord({
        resultType: "time",
        best: { type: "time", seconds: 150 },
        delta: { value: 20, improved: false },
        series: benchmarkSeriesOf({ type: "time", seconds: 150 }, { type: "time", seconds: 170 }),
      }),
    );

    expect(trendDown()).toHaveStyle({ color: ERROR_RED });
    expect(screen.getByText("20 s")).toBeInTheDocument();
  });
});

describe("RecordCard headline formats", () => {
  it("renders a load benchmark headline with kg", () => {
    renderBenchmark(
      benchmarkRecord({
        resultType: "load",
        best: { type: "load", kg: 102.5 },
        delta: { value: 5, improved: true },
        series: benchmarkSeriesOf({ type: "load", kg: 97.5 }, { type: "load", kg: 102.5 }),
      }),
    );

    expect(screen.getByText("102.5")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  it("renders a rounds_reps benchmark headline as rounds + reps", () => {
    renderBenchmark(
      benchmarkRecord({
        resultType: "rounds_reps",
        best: { type: "rounds_reps", rounds: 18, reps: 7 },
        delta: { value: 1, improved: true },
        series: benchmarkSeriesOf(
          { type: "rounds_reps", rounds: 17, reps: 7 },
          { type: "rounds_reps", rounds: 18, reps: 7 },
        ),
      }),
    );

    expect(screen.getByText("18 + 7")).toBeInTheDocument();
    expect(screen.getByText("rounds")).toBeInTheDocument();
  });

  it("renders a calories benchmark headline with cal", () => {
    renderBenchmark(
      benchmarkRecord({
        resultType: "calories",
        best: { type: "calories", value: 60 },
        delta: { value: 10, improved: true },
        series: benchmarkSeriesOf({ type: "calories", value: 50 }, { type: "calories", value: 60 }),
      }),
    );

    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("cal")).toBeInTheDocument();
  });
});

describe("RecordCard expanded history", () => {
  it("marks exactly the isBest row with the PR chip and leaves non-best rows unmarked", () => {
    renderBenchmark(
      benchmarkRecord({
        series: [
          {
            result: { type: "time", seconds: 180 },
            scalar: 180,
            recordedAt: "2026-01-10T00:00:00.000Z",
            isBest: false,
          },
          {
            result: { type: "time", seconds: 150 },
            scalar: 150,
            recordedAt: "2026-02-10T00:00:00.000Z",
            isBest: true,
          },
        ],
      }),
      true,
    );

    const historyLabel = screen.getByText("History");
    const historyPane = historyLabel.parentElement as HTMLElement;

    const bestRow = within(historyPane).getByText("2:30").closest("div");
    const nonBestRow = within(historyPane).getByText("3:00").closest("div");

    expect(bestRow).not.toBeNull();
    expect(nonBestRow).not.toBeNull();
    expect(within(bestRow as HTMLElement).getByText("PR")).toBeInTheDocument();
    expect(within(nonBestRow as HTMLElement).queryByText("PR")).not.toBeInTheDocument();
  });

  it("flags the single best 1RM history row with the Current PR chip", () => {
    renderOneRm(oneRMRecord(), true);

    const prChips = screen.getAllByText("Current PR");

    expect(prChips).toHaveLength(1);
  });

  it("renders the lower-is-better cue only for a time benchmark", () => {
    renderBenchmark(benchmarkRecord({ resultType: "time" }), true);

    expect(screen.getByText("Lower is better")).toBeInTheDocument();
  });

  it("omits the lower-is-better cue for a higher-is-better benchmark", () => {
    renderBenchmark(
      benchmarkRecord({
        resultType: "load",
        best: { type: "load", kg: 100 },
        delta: { value: 5, improved: true },
        series: benchmarkSeriesOf({ type: "load", kg: 95 }, { type: "load", kg: 100 }),
      }),
      true,
    );

    expect(screen.queryByText("Lower is better")).not.toBeInTheDocument();
  });

  it("invokes onUpdateOneRm with the exercise id from the expanded 1RM card", () => {
    const onUpdateOneRm = vi.fn();

    render(
      <RecordCard
        kind="oneRM"
        record={oneRMRecord()}
        isOpen
        onToggle={vi.fn()}
        onUpdateOneRm={onUpdateOneRm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update this 1RM" }));

    expect(onUpdateOneRm).toHaveBeenCalledWith("clz0000000000000000000ex01");
  });
});
