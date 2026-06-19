import { type ReactElement, type ReactNode } from "react";

import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render as baseRender,
  fireEvent,
  type RenderResult,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
import type {
  CreatePlanEnrollmentRequest,
  PlanEnrollment,
} from "@repo/contracts/lms/plan-enrollment";
import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { theme } from "@repo/mui";

import { DateLocalizationProvider } from "@app/lib/components";
import type * as AppHooks from "@app/lib/hooks";

import { type EnrollOutcome, tallyEnrollOutcomes } from "./enroll-add-view";

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const BOARDED_AT_UTC = new Date("2026-03-09T00:00:00.000Z");

const athletesState = {
  data: undefined as { athletes: CoachAthleteListItem[] } | undefined,
  isPending: false,
};
const enrollmentsState = {
  data: undefined as PlanEnrollment[] | undefined,
  isPending: false,
};
const mutateAsyncMock = vi.fn<(data: CreatePlanEnrollmentRequest) => Promise<PlanEnrollment>>();
const invalidateMock = vi.fn<() => void>();
const toastSuccessMock = vi.fn<(message: string) => void>();
const toastErrorMock = vi.fn<(message: string) => void>();

vi.mock("@app/lib/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof AppHooks>();

  return {
    toBoardedAt: actual.toBoardedAt,
    useCoachAthletes: () => ({ data: athletesState.data, isPending: athletesState.isPending }),
    usePlanEnrollments: () => ({
      data: enrollmentsState.data,
      isPending: enrollmentsState.isPending,
    }),
    useCreateEnrollment: () => ({ mutateAsync: mutateAsyncMock }),
    useInvalidateEnrollmentCaches: () => invalidateMock,
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: (message: string) => toastSuccessMock(message),
    error: (message: string) => toastErrorMock(message),
  },
}));

const { EnrollAddView } = await import("./enroll-add-view");

const ATHLETE_IDS = {
  active: "clp9z8x7w0000abcd1234actv",
  paused: "clp9z8x7w0000abcd1234paus",
  pending: "clp9z8x7w0000abcd1234pend",
  removed: "clp9z8x7w0000abcd1234rmvd",
  fresh: "clp9z8x7w0000abcd1234frsh",
  fresh2: "clp9z8x7w0000abcd1234frs2",
};

const makeAthlete = (overrides: Partial<CoachAthleteListItem> = {}): CoachAthleteListItem => ({
  userId: ATHLETE_IDS.fresh,
  name: "Fresh Athlete",
  email: "fresh@example.com",
  image: null,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  gender: Gender.MALE,
  heightCm: 180,
  weightKg: 80,
  enrollments: [],
  processStatus: ProcessStatus.ON_TRACK,
  lastActivityDate: null,
  daysSinceLastActivity: null,
  openActionItemsCount: 0,
  needsAttention: false,
  isPending: false,
  enrolledSince: BOARDED_AT_UTC,
  ...overrides,
});

const makeEnrollment = (overrides: Partial<PlanEnrollment> = {}): PlanEnrollment => ({
  id: "clp9z8x7w0000abcd1234enrl",
  planId: PLAN_ID,
  athleteId: ATHLETE_IDS.active,
  enrolledById: "clp9z8x7w0000abcd1234coch",
  boardedAt: BOARDED_AT_UTC,
  status: EnrollmentStatus.ACTIVE,
  statusChangedAt: BOARDED_AT_UTC,
  hidePastBeforeBoarding: false,
  createdAt: BOARDED_AT_UTC,
  updatedAt: BOARDED_AT_UTC,
  ...overrides,
});

const settled = (
  ...promises: Promise<PlanEnrollment>[]
): Promise<PromiseSettledResult<PlanEnrollment>[]> => Promise.allSettled(promises);

const Wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <DateLocalizationProvider>{children}</DateLocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const renderAddView = (props: Partial<Parameters<typeof EnrollAddView>[0]> = {}): RenderResult => {
  const ui: ReactElement = (
    <EnrollAddView
      planId={PLAN_ID}
      canEnroll
      onBack={props.onBack ?? vi.fn()}
      onEnrolled={props.onEnrolled ?? vi.fn()}
      {...props}
    />
  );

  return baseRender(ui, { wrapper: Wrapper });
};

beforeEach(() => {
  athletesState.data = { athletes: [] };
  athletesState.isPending = false;
  enrollmentsState.data = [];
  enrollmentsState.isPending = false;
  mutateAsyncMock.mockReset();
  invalidateMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("tallyEnrollOutcomes", () => {
  const enrollment = makeEnrollment();

  it("counts every fulfilled result as enrolled (ENR-W2)", async () => {
    const results = await settled(
      Promise.resolve(enrollment),
      Promise.resolve(enrollment),
      Promise.resolve(enrollment),
    );

    expect(tallyEnrollOutcomes(results)).toEqual<EnrollOutcome>({
      enrolled: 3,
      alreadyEnrolled: 0,
      failed: 0,
    });
  });

  it("classifies an /already enrolled/i rejection as alreadyEnrolled (ENR-W2)", async () => {
    const results = await settled(
      Promise.reject(new Error("Athlete is already enrolled in this plan")),
    );

    expect(tallyEnrollOutcomes(results)).toEqual<EnrollOutcome>({
      enrolled: 0,
      alreadyEnrolled: 1,
      failed: 0,
    });
  });

  it("classifies any other rejection as failed (ENR-W2)", async () => {
    const results = await settled(
      Promise.reject(new Error("Plan must be ACTIVE to enroll athletes")),
    );

    expect(tallyEnrollOutcomes(results)).toEqual<EnrollOutcome>({
      enrolled: 0,
      alreadyEnrolled: 0,
      failed: 1,
    });
  });

  it("splits a mixed batch three ways (ENR-W2)", async () => {
    const results = await settled(
      Promise.resolve(enrollment),
      Promise.reject(new Error("Athlete is already enrolled in this plan")),
      Promise.reject(new Error("network down")),
    );

    expect(tallyEnrollOutcomes(results)).toEqual<EnrollOutcome>({
      enrolled: 1,
      alreadyEnrolled: 1,
      failed: 1,
    });
  });
});

describe("EnrollAddView picker filter", () => {
  it("excludes live-enrolled and pending athletes, includes a previously-removed one with the hint (QA-07)", () => {
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: ATHLETE_IDS.active, name: "Active Athlete" }),
        makeAthlete({ userId: ATHLETE_IDS.paused, name: "Paused Athlete" }),
        makeAthlete({ userId: ATHLETE_IDS.pending, name: "Pending Athlete", isPending: true }),
        makeAthlete({
          userId: ATHLETE_IDS.removed,
          name: "Removed Athlete",
          enrollments: [
            {
              planId: PLAN_ID,
              planName: "Plan",
              status: EnrollmentStatus.REMOVED,
              boardedAt: BOARDED_AT_UTC,
            },
          ],
        }),
        makeAthlete({ userId: ATHLETE_IDS.fresh, name: "Fresh Athlete" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: ATHLETE_IDS.active, status: EnrollmentStatus.ACTIVE }),
      makeEnrollment({ athleteId: ATHLETE_IDS.paused, status: EnrollmentStatus.PAUSED }),
    ];

    renderAddView();

    expect(screen.getByText("Removed Athlete")).toBeInTheDocument();
    expect(screen.getByText("Fresh Athlete")).toBeInTheDocument();
    expect(screen.getByText("· previously removed")).toBeInTheDocument();
    expect(screen.queryByText("Active Athlete")).toBeNull();
    expect(screen.queryByText("Paused Athlete")).toBeNull();
    expect(screen.queryByText("Pending Athlete")).toBeNull();
  });

  it("shows the loading message while the roster is pending, not the everyone-enrolled message (QA-04)", () => {
    athletesState.data = undefined;
    athletesState.isPending = true;
    enrollmentsState.data = [];

    renderAddView();

    expect(screen.getByText("Loading athletes…")).toBeInTheDocument();
    expect(screen.queryByText("Every athlete is already enrolled.")).toBeNull();
  });
});

describe("EnrollAddView plan-active gate", () => {
  it("disables the Enroll button when canEnroll is false even with a selection (QA-09)", () => {
    athletesState.data = { athletes: [makeAthlete({ userId: ATHLETE_IDS.fresh })] };

    renderAddView({ canEnroll: false });

    fireEvent.click(screen.getByText("Fresh Athlete"));

    expect(screen.getByRole("button", { name: /Enroll 1 athlete/ })).toBeDisabled();
  });

  it("enables the Enroll button when canEnroll is true and at least one is selected (QA-09)", () => {
    athletesState.data = { athletes: [makeAthlete({ userId: ATHLETE_IDS.fresh })] };

    renderAddView({ canEnroll: true });

    expect(screen.getByRole("button", { name: /Enroll 0 athletes/ })).toBeDisabled();

    fireEvent.click(screen.getByText("Fresh Athlete"));

    expect(screen.getByRole("button", { name: /Enroll 1 athlete/ })).toBeEnabled();
  });
});

describe("EnrollAddView multi-enroll aggregate", () => {
  const renderTwoSelected = (onEnrolled = vi.fn()): RenderResult => {
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: ATHLETE_IDS.fresh, name: "Fresh Athlete" }),
        makeAthlete({ userId: ATHLETE_IDS.fresh2, name: "Second Athlete" }),
      ],
    };

    const view = renderAddView({ onEnrolled });

    fireEvent.click(screen.getByText("Fresh Athlete"));
    fireEvent.click(screen.getByText("Second Athlete"));

    return view;
  };

  it("fires one create per selected athlete and one success toast on all-fulfilled (QA-04)", async () => {
    mutateAsyncMock.mockResolvedValue(makeEnrollment());
    const onEnrolled = vi.fn();

    renderTwoSelected(onEnrolled);

    fireEvent.click(screen.getByRole("button", { name: /Enroll 2 athletes/ }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
    expect(toastSuccessMock).toHaveBeenCalledWith("Enrolled 2 athletes");
    expect(invalidateMock).toHaveBeenCalledTimes(1);
    expect(onEnrolled).toHaveBeenCalledTimes(1);
  });

  it("sends a UTC-midnight boardedAt with each create (QA-02)", async () => {
    mutateAsyncMock.mockResolvedValue(makeEnrollment());

    renderTwoSelected();

    fireEvent.click(screen.getByRole("button", { name: /Enroll 2 athletes/ }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(2));

    for (const call of mutateAsyncMock.mock.calls) {
      expect(call[0].boardedAt.toISOString().endsWith("T00:00:00.000Z")).toBe(true);
    }
  });

  it("emits one partial-conflict toast and never throws when one create reports already-enrolled (QA-04)", async () => {
    mutateAsyncMock
      .mockResolvedValueOnce(makeEnrollment())
      .mockRejectedValueOnce(new Error("Athlete is already enrolled in this plan"));

    renderTwoSelected();

    fireEvent.click(screen.getByRole("button", { name: /Enroll 2 athletes/ }));

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(toastSuccessMock).toHaveBeenCalledWith("1 enrolled · 1 already on this plan");
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(invalidateMock).toHaveBeenCalledTimes(1);
  });
});

describe("EnrollAddView double-submit latch", () => {
  it("fires the batch once when the enroll handler is triggered twice synchronously (QA-01)", async () => {
    let resolveFirst: (value: PlanEnrollment) => void = () => undefined;
    const gate = new Promise<PlanEnrollment>((resolve) => {
      resolveFirst = resolve;
    });

    mutateAsyncMock.mockReturnValue(gate);
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: ATHLETE_IDS.fresh, name: "Fresh Athlete" }),
        makeAthlete({ userId: ATHLETE_IDS.fresh2, name: "Second Athlete" }),
      ],
    };

    renderAddView();

    fireEvent.click(screen.getByText("Fresh Athlete"));
    fireEvent.click(screen.getByText("Second Athlete"));

    const enrollButton = screen.getByRole("button", { name: /Enroll 2 athletes/ });

    fireEvent.click(enrollButton);
    fireEvent.click(enrollButton);

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);

    resolveFirst(makeEnrollment());

    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalledTimes(1));

    expect(mutateAsyncMock).toHaveBeenCalledTimes(2);
  });
});
