import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type GetAthleteMovementsResponse } from "@repo/contracts/lms/exercise";
import { OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";
import {
  type BenchmarkRecordView,
  type OneRMRecordView,
  type RecordsViewResponse,
} from "@repo/contracts/lms/records-view";

import { DatePickerStub } from "@app/test/date-picker-stub";
import { render } from "@app/test/render";

const useAthleteRecordsMock = vi.fn();
const useAthleteMovementsMock = vi.fn();

const MOVEMENT_CATALOG: GetAthleteMovementsResponse = [
  { id: "clz0000000000000000000ex07", canonicalName: "Overhead Squat" },
];

vi.mock("@app/lib/hooks/use-athlete-records", () => ({
  useAthleteRecords: () => useAthleteRecordsMock(),
}));

vi.mock("@app/lib/hooks/use-exercises", () => ({
  useAthleteMovements: () => useAthleteMovementsMock(),
}));

vi.mock("@app/lib/hooks/use-one-rm-records", () => ({
  useCreateOneRMRecord: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@mui/x-date-pickers/DatePicker", () => ({ DatePicker: DatePickerStub }));

const { AthleteRecordsView } = await import("./athlete-records-view");

beforeEach(() => {
  useAthleteMovementsMock.mockReturnValue({
    data: MOVEMENT_CATALOG,
    isLoading: false,
    error: null,
  });
});

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

const openPicker = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Update 1RM" }));
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

const optionLabels = (): (string | null)[] =>
  screen.queryAllByRole("option").map((node) => node.textContent);

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

  it("feeds the fetched movement catalog into the 1RM picker", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse({ oneRM: [], benchmarks: [] }),
      isLoading: false,
      error: null,
    });

    render(<AthleteRecordsView />);

    openPicker();

    expect(optionLabels()).toEqual(["Overhead Squat"]);
  });
});

describe("AthleteRecordsView movement catalog states", () => {
  it("says the movement list is loading rather than reading as no such movement", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse({ oneRM: [], benchmarks: [] }),
      isLoading: false,
      error: null,
    });
    useAthleteMovementsMock.mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(<AthleteRecordsView />);

    openPicker();

    expect(screen.getByText("Loading movements…")).toBeInTheDocument();
    expect(screen.queryByText("No options")).not.toBeInTheDocument();
  });

  it("says the movement list failed rather than reading as no such movement", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse({ oneRM: [], benchmarks: [] }),
      isLoading: false,
      error: null,
    });
    useAthleteMovementsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    });

    render(<AthleteRecordsView />);

    openPicker();

    expect(
      screen.getByText("Movement list unavailable. Reload the page to try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No options")).not.toBeInTheDocument();
  });

  it("still offers the athlete's own movements while the catalog is loading", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse(),
      isLoading: false,
      error: null,
    });
    useAthleteMovementsMock.mockReturnValue({ data: undefined, isLoading: true, error: null });

    render(<AthleteRecordsView />);

    openPicker();

    expect(optionLabels()).toEqual(["Back Squat"]);
    expect(screen.queryByText("Loading movements…")).not.toBeInTheDocument();
  });

  it("still offers the athlete's own movements when the catalog failed", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse(),
      isLoading: false,
      error: null,
    });
    useAthleteMovementsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("boom"),
    });

    render(<AthleteRecordsView />);

    openPicker();

    expect(optionLabels()).toEqual(["Back Squat"]);
    expect(
      screen.queryByText("Movement list unavailable. Reload the page to try again."),
    ).not.toBeInTheDocument();
  });

  it("keeps offering a loaded catalog when a background refetch errors", () => {
    useAthleteRecordsMock.mockReturnValue({
      data: buildResponse({ oneRM: [], benchmarks: [] }),
      isLoading: false,
      error: null,
    });
    useAthleteMovementsMock.mockReturnValue({
      data: MOVEMENT_CATALOG,
      isLoading: false,
      error: new Error("boom"),
    });

    render(<AthleteRecordsView />);

    openPicker();

    expect(optionLabels()).toEqual(["Overhead Squat"]);
  });
});
