import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type BenchmarkRecordView,
  type OneRMRecordView,
  type RecordsViewResponse,
} from "@repo/contracts/lms/records-view";

import { render } from "@app/test/render";

const useAthleteRecordsMock = vi.fn();

vi.mock("@app/lib/hooks/use-athlete-records", () => ({
  useAthleteRecords: () => useAthleteRecordsMock(),
}));

vi.mock("@app/lib/hooks/use-exercises", () => ({
  useExercises: () => ({ data: [], isLoading: false }),
}));

vi.mock("@app/lib/hooks/use-one-rm-records", () => ({
  useCreateOneRMRecord: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { AthleteRecordsView } = await import("./athlete-records-view");

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

const buildResponse = (overrides: Partial<RecordsViewResponse> = {}): RecordsViewResponse => ({
  oneRM: [oneRMRecord()],
  benchmarks: [benchmarkRecord()],
  ...overrides,
});

describe("AthleteRecordsView", () => {
  it("renders the loading state while the query is pending", () => {
    useAthleteRecordsMock.mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(<AthleteRecordsView />);

    expect(screen.getByText("Loading your records...")).toBeInTheDocument();
  });

  it("renders the error state when the query fails", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    });

    render(<AthleteRecordsView />);

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
  });

  it("renders the everyday empty copy when both sections are empty", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse({ oneRM: [], benchmarks: [] }),
      isLoading: false,
      error: null,
    });

    render(<AthleteRecordsView />);

    expect(screen.getByText("No 1RMs logged yet")).toBeInTheDocument();
    expect(screen.queryByText("No records match your search.")).not.toBeInTheDocument();
  });

  it("renders the records title and the 1RM record card on loaded data", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse(),
      isLoading: false,
      error: null,
    });

    render(<AthleteRecordsView />);

    expect(screen.getByRole("heading", { name: "Records" })).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });
});
