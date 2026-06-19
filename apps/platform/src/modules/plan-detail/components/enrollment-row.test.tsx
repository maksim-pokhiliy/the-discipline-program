import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
import type { PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";
import { EnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";

import { render } from "@app/test/render";

import { EnrollmentRow } from "./enrollment-row";

const PLAN_ID = "ckxw5p7gp0000q1mnzv5cuq0a";
const ATHLETE_ID = "clp9z8x7w0000abcd1234athl";
const ENROLLMENT_ID = "clp9z8x7w0000abcd1234enrl";
const BOARDED_AT_UTC = new Date("2026-03-09T00:00:00.000Z");

const makeEnrollment = (overrides: Partial<PlanEnrollment> = {}): PlanEnrollment => ({
  id: ENROLLMENT_ID,
  planId: PLAN_ID,
  athleteId: ATHLETE_ID,
  enrolledById: "clp9z8x7w0000abcd1234coch",
  boardedAt: BOARDED_AT_UTC,
  status: EnrollmentStatus.ACTIVE,
  statusChangedAt: BOARDED_AT_UTC,
  hidePastBeforeBoarding: false,
  createdAt: BOARDED_AT_UTC,
  updatedAt: BOARDED_AT_UTC,
  ...overrides,
});

const makeAthlete = (overrides: Partial<CoachAthleteListItem> = {}): CoachAthleteListItem => ({
  userId: ATHLETE_ID,
  name: "Casey Coach",
  email: "casey@example.com",
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

const renderRow = (props: Partial<Parameters<typeof EnrollmentRow>[0]> = {}) =>
  render(
    <EnrollmentRow
      enrollment={makeEnrollment()}
      athlete={makeAthlete()}
      onPause={vi.fn()}
      onResume={vi.fn()}
      onRemove={vi.fn()}
      isMutating={false}
      {...props}
    />,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EnrollmentRow boarding date", () => {
  it("renders the boarding day from the UTC calendar formatter (QA-02)", () => {
    renderRow({ enrollment: makeEnrollment({ boardedAt: BOARDED_AT_UTC }) });

    expect(screen.getByText(/Boarded Mar 9/)).toBeInTheDocument();
  });
});

describe("EnrollmentRow quick action", () => {
  it("offers Pause when the enrollment is ACTIVE", () => {
    const onPause = vi.fn();

    renderRow({ enrollment: makeEnrollment({ status: EnrollmentStatus.ACTIVE }), onPause });

    const pauseButton = screen.getByRole("button", { name: "Pause" });

    fireEvent.click(pauseButton);

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Resume" })).toBeNull();
  });

  it("offers Resume when the enrollment is PAUSED", () => {
    const onResume = vi.fn();

    renderRow({ enrollment: makeEnrollment({ status: EnrollmentStatus.PAUSED }), onResume });

    const resumeButton = screen.getByRole("button", { name: "Resume" });

    fireEvent.click(resumeButton);

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  });
});

describe("EnrollmentRow remove flow", () => {
  it("opens the confirm and calls onRemove only after confirming", () => {
    const onRemove = vi.fn();

    renderRow({ athlete: makeAthlete({ name: "Casey Coach" }), onRemove });

    fireEvent.click(screen.getByRole("button", { name: "Enrollment actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove from plan" }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText(/Remove Casey Coach from this plan/)).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not call onRemove when the confirm is cancelled", () => {
    const onRemove = vi.fn();

    renderRow({ onRemove });

    fireEvent.click(screen.getByRole("button", { name: "Enrollment actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove from plan" }));

    const dialog = screen.getByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onRemove).not.toHaveBeenCalled();
  });
});
