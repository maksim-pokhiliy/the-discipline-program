import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type BenchmarkRecordView,
  type OneRMRecordView,
  type RecordsViewResponse,
} from "@repo/contracts/lms/records-view";

import { render } from "@app/test/render";

vi.mock("@app/lib/hooks/use-exercises", () => ({
  useExercises: () => ({ data: [], isLoading: false }),
}));

vi.mock("@app/lib/hooks/use-one-rm-records", () => ({
  useCreateOneRMRecord: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { RecordsContent } = await import("./records-content");

const oneRMRecord = (overrides: Partial<OneRMRecordView> = {}): OneRMRecordView => ({
  exerciseId: "clz0000000000000000000ex01",
  exerciseName: "Back Squat",
  best: 120,
  bestSource: OneRMRecordSource.TESTED,
  bestRecordedAt: "2026-02-01T00:00:00.000Z",
  lastRecordedAt: "2026-03-01T00:00:00.000Z",
  delta: -10,
  recordCount: 3,
  series: [
    {
      valueKg: 120,
      source: OneRMRecordSource.TESTED,
      recordedAt: "2026-02-01T00:00:00.000Z",
      isBest: true,
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
      result: { type: "time", seconds: 150 },
      scalar: 150,
      recordedAt: "2026-02-10T00:00:00.000Z",
      isBest: true,
    },
  ],
  attemptCount: 1,
  ...overrides,
});

const data = (overrides: Partial<RecordsViewResponse> = {}): RecordsViewResponse => ({
  oneRM: [oneRMRecord()],
  benchmarks: [benchmarkRecord()],
  ...overrides,
});

const oneRmTab = (): HTMLElement => screen.getByRole("tab", { name: /1RM/ });
const benchmarkTab = (): HTMLElement => screen.getByRole("tab", { name: /Benchmarks/ });
const searchBox = (placeholder: RegExp): HTMLElement => screen.getByPlaceholderText(placeholder);

describe("RecordsContent", () => {
  it("shows the 1RM section first with count pills on both tabs", () => {
    render(
      <RecordsContent
        data={data({
          oneRM: [oneRMRecord(), oneRMRecord({ exerciseId: "ex2", exerciseName: "Deadlift" })],
        })}
      />,
    );

    expect(within(oneRmTab()).getByText("2")).toBeInTheDocument();
    expect(within(benchmarkTab()).getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
    expect(screen.queryByText("Fran")).not.toBeInTheDocument();
  });

  it("switches from 1RM to Benchmarks when the benchmark tab is clicked", () => {
    render(<RecordsContent data={data()} />);

    fireEvent.click(benchmarkTab());

    expect(screen.getByText("Fran")).toBeInTheDocument();
    expect(screen.queryByText("Back Squat")).not.toBeInTheDocument();
  });

  it("shows the Update 1RM button only on the 1RM section", () => {
    render(<RecordsContent data={data()} />);

    expect(screen.getByRole("button", { name: "Update 1RM" })).toBeInTheDocument();

    fireEvent.click(benchmarkTab());

    expect(screen.queryByRole("button", { name: "Update 1RM" })).not.toBeInTheDocument();
  });

  it("filters 1RM records by movement name", () => {
    render(
      <RecordsContent
        data={data({
          oneRM: [oneRMRecord(), oneRMRecord({ exerciseId: "ex2", exerciseName: "Deadlift" })],
        })}
      />,
    );

    fireEvent.change(searchBox(/Search movements/), { target: { value: "dead" } });

    expect(screen.getByText("Deadlift")).toBeInTheDocument();
    expect(screen.queryByText("Back Squat")).not.toBeInTheDocument();
  });

  it("filters benchmark records by title", () => {
    render(
      <RecordsContent
        data={data({
          benchmarks: [
            benchmarkRecord(),
            benchmarkRecord({ plannedSchemaId: "sch2", title: "Grace" }),
          ],
        })}
      />,
    );

    fireEvent.click(benchmarkTab());
    fireEvent.change(searchBox(/Search benchmarks/), { target: { value: "grace" } });

    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.queryByText("Fran")).not.toBeInTheDocument();
  });

  it("shows the no-match copy when a search filters everything out", () => {
    render(<RecordsContent data={data()} />);

    fireEvent.change(searchBox(/Search movements/), { target: { value: "zzz-nothing" } });

    expect(screen.getByText("No records match your search.")).toBeInTheDocument();
    expect(screen.queryByText("No 1RMs logged yet")).not.toBeInTheDocument();
  });

  it("resets the search query when the section toggles", () => {
    render(<RecordsContent data={data()} />);

    fireEvent.change(searchBox(/Search movements/), { target: { value: "Back" } });
    fireEvent.click(benchmarkTab());

    expect(searchBox(/Search benchmarks/)).toHaveValue("");
    expect(screen.getByText("Fran")).toBeInTheDocument();
  });

  it("shows the everyday empty copy for an empty 1RM section, distinct from the no-match copy", () => {
    render(<RecordsContent data={data({ oneRM: [] })} />);

    expect(screen.getByText("No 1RMs logged yet")).toBeInTheDocument();
    expect(screen.queryByText("No records match your search.")).not.toBeInTheDocument();
  });
});
