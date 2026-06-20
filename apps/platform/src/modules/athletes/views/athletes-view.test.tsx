import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type {
  CoachAthleteListItem,
  CoachAthletesData,
  CoachAthletesSummary,
} from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/coach/athletes",
  useSearchParams: () => new URLSearchParams(),
}));

const coachAthletesMock = vi.fn();

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCoachAthletes: () => coachAthletesMock(),
  };
});

const { AthletesView } = await import("./athletes-view");

const NOW = new Date("2026-06-20T00:00:00.000Z");

const makeSummary = (overrides: Partial<CoachAthletesSummary> = {}): CoachAthletesSummary => ({
  total: 3,
  active: 3,
  needsAttention: 0,
  injured: 0,
  restricted: 0,
  ...overrides,
});

const makeAthlete = (
  overrides: Partial<CoachAthleteListItem> & Pick<CoachAthleteListItem, "userId">,
): CoachAthleteListItem => ({
  name: "Aria Stone",
  email: "aria@example.com",
  image: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  gender: Gender.FEMALE,
  heightCm: null,
  weightKg: null,
  enrollments: [],
  processStatus: ProcessStatus.ON_TRACK,
  lastActivityDate: NOW,
  daysSinceLastActivity: 1,
  openActionItemsCount: 0,
  needsAttention: false,
  isPending: false,
  enrolledSince: NOW,
  ...overrides,
});

const setLoaded = (data: CoachAthletesData): void => {
  coachAthletesMock.mockReturnValue({ data, isLoading: false, error: null });
};

const setLoading = (): void => {
  coachAthletesMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
};

afterEach(() => {
  coachAthletesMock.mockReset();
});

describe("AthletesView eyebrow gating", () => {
  it("renders the Athletes title and an active-count eyebrow once data loads", () => {
    setLoaded({
      summary: makeSummary({ active: 3, needsAttention: 0 }),
      athletes: [makeAthlete({ userId: "clz00000000000000000ath1" })],
    });

    render(<AthletesView />);

    expect(screen.getByRole("heading", { name: "Athletes" })).toBeInTheDocument();
    expect(screen.getByText("3 active")).toBeInTheDocument();
  });

  it("surfaces the needs-attention count in the eyebrow when it is non-zero", () => {
    setLoaded({
      summary: makeSummary({ active: 4, needsAttention: 2 }),
      athletes: [makeAthlete({ userId: "clz00000000000000000ath2" })],
    });

    render(<AthletesView />);

    expect(screen.getByText("4 active · 2 needs attention")).toBeInTheDocument();
  });

  it("omits the eyebrow (no count, no 'undefined') while data is loading", () => {
    setLoading();

    render(<AthletesView />);

    expect(screen.getByRole("heading", { name: "Athletes" })).toBeInTheDocument();
    expect(screen.queryByText(/active/)).toBeNull();
    expect(screen.queryByText(/undefined/)).toBeNull();
  });
});
