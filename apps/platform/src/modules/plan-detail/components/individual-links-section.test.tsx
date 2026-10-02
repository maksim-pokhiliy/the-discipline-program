import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
import type {
  GetLinkableAthletesResponse,
  IndividualMobileLink,
} from "@repo/contracts/coaching/mobile-link";
import { EnrollmentStatus, type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";
import { formatDate } from "@repo/shared";

import { makeIndividualLink } from "@app/lib/mobile.fixtures";
import { render } from "@app/test/render";

type QueryState<TData> = {
  data: TData | undefined;
  error: Error | null;
  isError: boolean;
  isPending: boolean;
};

const PLAN_ID = "ckplan1234567890abcdef0123";
const LINKED_ATHLETE_ID = "ckathl1234567890abcdef0123";
const UNLINKED_ATHLETE_ID = "ckathl0000000000000000pat0";
const ORPHAN_ATHLETE_ID = "ckathl00000000000000orphan";
const ENROLLMENT_ID = "ckenrl1234567890abcdef0123";
const UNLINKED_ENROLLMENT_ID = "ckenrl0000000000000000pat0";
const LINK_ID = "cklink1234567890abcdef0123";
const ORPHAN_LINK_ID = "cklink00000000000000orphan";
const NOW = new Date("2026-01-05T00:00:00.000Z");
const ATHLETES_ERROR_MESSAGE = "Couldn't load athletes. Try again.";
const EMPTY_MESSAGE = "No enrolled athletes to link yet.";
const NO_ACCOUNT_CAPTION = "No Individual-plan account in the mobile app";
const SESSION_EXPIRED_REASON = "SESSION_EXPIRED";

const enrollmentsState: QueryState<PlanEnrollment[]> = {
  data: [],
  error: null,
  isError: false,
  isPending: false,
};
const athletesState: QueryState<{ athletes: CoachAthleteListItem[] }> = {
  data: { athletes: [] },
  error: null,
  isError: false,
  isPending: false,
};
const mobileAthletesState: QueryState<GetLinkableAthletesResponse> = {
  data: [],
  error: null,
  isError: false,
  isPending: false,
};

const createLinkMutate = vi.fn();
const deleteLinkMutate = vi.fn();
const mobileAthletesSpy = vi.fn<(...args: unknown[]) => void>();

vi.mock("@app/lib/hooks", () => ({
  usePlanEnrollments: () => enrollmentsState,
  useCoachAthletes: () => athletesState,
  useMobileAthletes: (...args: unknown[]) => {
    mobileAthletesSpy(...args);

    return mobileAthletesState;
  },
  useCreateMobileLink: () => ({ mutate: createLinkMutate, isPending: false }),
  useDeleteMobileLink: () => ({ mutate: deleteLinkMutate, isPending: false }),
}));

const { IndividualLinksSection } = await import("./individual-links-section");

const makeAthlete = (overrides: Partial<CoachAthleteListItem> = {}): CoachAthleteListItem => ({
  userId: LINKED_ATHLETE_ID,
  name: "Pat Platform",
  email: "pat@example.com",
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
  enrolledSince: NOW,
  ...overrides,
});

const makeEnrollment = (overrides: Partial<PlanEnrollment> = {}): PlanEnrollment => ({
  id: ENROLLMENT_ID,
  planId: PLAN_ID,
  athleteId: LINKED_ATHLETE_ID,
  enrolledById: "ckcoch1234567890abcdef0123",
  boardedAt: NOW,
  status: EnrollmentStatus.ACTIVE,
  statusChangedAt: NOW,
  hidePastBeforeBoarding: false,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const errorWithReason = (reason: string): Error => {
  const error = new Error("Session expired");

  Object.assign(error, { details: { reason } });

  return error;
};

const enrolLinkedAndUnlinked = (): void => {
  athletesState.data = {
    athletes: [
      makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" }),
      makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Sam Athlete" }),
    ],
  };
  enrollmentsState.data = [
    makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
    makeEnrollment({
      id: UNLINKED_ENROLLMENT_ID,
      athleteId: UNLINKED_ATHLETE_ID,
      status: EnrollmentStatus.ACTIVE,
    }),
  ];
};

const confirmUnlink = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Unlink mobile athlete" }));

  const dialog = screen.getByRole("dialog", { name: /Unlink mobile athlete\?/ });

  fireEvent.click(within(dialog).getByRole("button", { name: "Unlink" }));
};

const renderSection = (individualLinks: IndividualMobileLink[] = []) =>
  render(<IndividualLinksSection planId={PLAN_ID} individualLinks={individualLinks} />);

beforeEach(() => {
  enrollmentsState.data = [];
  enrollmentsState.error = null;
  enrollmentsState.isError = false;
  enrollmentsState.isPending = false;
  athletesState.data = { athletes: [] };
  athletesState.error = null;
  athletesState.isError = false;
  athletesState.isPending = false;
  mobileAthletesState.data = [];
  mobileAthletesState.error = null;
  mobileAthletesState.isError = false;
  mobileAthletesState.isPending = false;
  createLinkMutate.mockReset();
  deleteLinkMutate.mockReset();
  mobileAthletesSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IndividualLinksSection", () => {
  it("offers Link for a linkable unlinked athlete and links that athlete to their own account", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Sam Athlete" })],
    };
    enrollmentsState.data = [makeEnrollment({ athleteId: UNLINKED_ATHLETE_ID })];
    mobileAthletesState.data = [{ athleteId: UNLINKED_ATHLETE_ID }];

    renderSection([]);

    expect(screen.getByText("Sam Athlete")).toBeInTheDocument();
    expect(screen.queryByText(NO_ACCOUNT_CAPTION)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    expect(createLinkMutate).toHaveBeenCalledTimes(1);
    expect(createLinkMutate).toHaveBeenCalledWith({
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: UNLINKED_ATHLETE_ID,
    });
    expect(createLinkMutate.mock.calls[0]?.[0]).not.toHaveProperty("legacyUserId");
  });

  it("explains instead of offering Link when the unlinked athlete has no Individual-plan account", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Sam Athlete" })],
    };
    enrollmentsState.data = [makeEnrollment({ athleteId: UNLINKED_ATHLETE_ID })];
    mobileAthletesState.data = [];

    renderSection([]);

    expect(screen.getByText("Sam Athlete")).toBeInTheDocument();
    expect(screen.getByText(NO_ACCOUNT_CAPTION)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();
  });

  it("gives each unlinked row its own Link or caption by the linkable list", () => {
    enrolLinkedAndUnlinked();
    mobileAthletesState.data = [{ athleteId: UNLINKED_ATHLETE_ID }];

    renderSection([]);

    expect(screen.getAllByRole("button", { name: "Link" })).toHaveLength(1);
    expect(screen.getAllByText(NO_ACCOUNT_CAPTION)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    expect(createLinkMutate).toHaveBeenCalledWith({
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: UNLINKED_ATHLETE_ID,
    });
  });

  it("shows a linked athlete with Unlink and no Link or caption, and unlinks on danger confirm", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" })],
    };
    enrollmentsState.data = [makeEnrollment({ athleteId: LINKED_ATHLETE_ID })];
    mobileAthletesState.data = [{ athleteId: LINKED_ATHLETE_ID }];

    renderSection([makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID })]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlink mobile athlete" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();
    expect(screen.queryByText(NO_ACCOUNT_CAPTION)).toBeNull();
    expect(screen.queryByText(/Mobile:/)).toBeNull();

    confirmUnlink();

    expect(deleteLinkMutate).toHaveBeenCalledWith(LINK_ID);
  });

  it("names the platform athlete in the unlink confirm", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" })],
    };
    enrollmentsState.data = [makeEnrollment({ athleteId: LINKED_ATHLETE_ID })];

    renderSection([makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID })]);

    fireEvent.click(screen.getByRole("button", { name: "Unlink mobile athlete" }));

    const dialog = screen.getByRole("dialog", { name: /Unlink mobile athlete\?/ });

    expect(
      within(dialog).getByText("Stop publishing this plan to Pat Platform?"),
    ).toBeInTheDocument();
  });

  it("renders and unlinks an orphan link whose athlete is no longer enrolled", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: ORPHAN_ATHLETE_ID, name: "Orphan Athlete" })],
    };
    enrollmentsState.data = [];

    renderSection([makeIndividualLink({ id: ORPHAN_LINK_ID, athleteId: ORPHAN_ATHLETE_ID })]);

    expect(screen.getByText("Orphan Athlete")).toBeInTheDocument();

    confirmUnlink();

    expect(deleteLinkMutate).toHaveBeenCalledWith(ORPHAN_LINK_ID);
  });

  it("lists paused enrolments and leaves removed ones out", () => {
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Paused Athlete" }),
        makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Removed Athlete" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.PAUSED }),
      makeEnrollment({
        id: UNLINKED_ENROLLMENT_ID,
        athleteId: UNLINKED_ATHLETE_ID,
        status: EnrollmentStatus.REMOVED,
      }),
    ];
    mobileAthletesState.data = [{ athleteId: LINKED_ATHLETE_ID }];

    renderSection([]);

    expect(screen.getByText("Paused Athlete")).toBeInTheDocument();
    expect(screen.queryByText("Removed Athlete")).toBeNull();
  });

  it("falls back to Unknown athlete for a linked athlete missing from the roster", () => {
    athletesState.data = { athletes: [] };
    enrollmentsState.data = [];

    renderSection([makeIndividualLink({ id: ORPHAN_LINK_ID, athleteId: ORPHAN_ATHLETE_ID })]);

    expect(screen.getByText("Unknown athlete")).toBeInTheDocument();
  });

  it("shows the empty state when no athlete is enrolled or linked", () => {
    renderSection([]);

    expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();
  });

  it("loads the linkable athletes for this plan", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" })],
    };
    enrollmentsState.data = [makeEnrollment({ athleteId: LINKED_ATHLETE_ID })];

    renderSection([]);

    expect(mobileAthletesSpy).toHaveBeenCalled();
    expect(mobileAthletesSpy.mock.calls.every((args) => args.length === 1)).toBe(true);
    expect(mobileAthletesSpy).toHaveBeenCalledWith(PLAN_ID);
  });

  it("shows a spinner in place of the unlinked rows while the linkable athletes load, keeping the linked row", () => {
    enrolLinkedAndUnlinked();
    mobileAthletesState.data = undefined;
    mobileAthletesState.isPending = true;

    renderSection([makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID })]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlink mobile athlete" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Sam Athlete")).toBeNull();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();
    expect(screen.queryByText(NO_ACCOUNT_CAPTION)).toBeNull();
  });

  it("keeps the linked row unlinkable and shows the plain error alert, with no Reconnect prompt, when the athletes error carries a session-expired reason", () => {
    enrolLinkedAndUnlinked();
    mobileAthletesState.data = undefined;
    mobileAthletesState.error = errorWithReason(SESSION_EXPIRED_REASON);
    mobileAthletesState.isError = true;

    renderSection([makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID })]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(ATHLETES_ERROR_MESSAGE);
    expect(screen.queryByRole("button", { name: "Reconnect" })).toBeNull();
    expect(screen.queryByText(/Connection expired/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();

    confirmUnlink();

    expect(deleteLinkMutate).toHaveBeenCalledWith(LINK_ID);
  });

  it("keeps the linked row unlinkable and shows the error alert in place of the unlinked rows on a plain error", () => {
    enrolLinkedAndUnlinked();
    mobileAthletesState.data = undefined;
    mobileAthletesState.error = new Error("server 500");
    mobileAthletesState.isError = true;

    renderSection([makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID })]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.getByText(ATHLETES_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText("Sam Athlete")).toBeNull();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();
    expect(screen.queryByText(NO_ACCOUNT_CAPTION)).toBeNull();

    confirmUnlink();

    expect(deleteLinkMutate).toHaveBeenCalledWith(LINK_ID);
  });

  it("shows a spinner instead of the empty-state flash while the roster is still loading (QA-07)", () => {
    enrollmentsState.data = undefined;
    enrollmentsState.isPending = true;
    athletesState.data = undefined;
    athletesState.isPending = true;

    renderSection([]);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });

  it("shows a spinner instead of an Unknown athlete flash while the roster is still loading (QA-07)", () => {
    enrollmentsState.data = undefined;
    enrollmentsState.isPending = true;
    athletesState.data = undefined;
    athletesState.isPending = true;

    renderSection([makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID })]);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Unknown athlete")).toBeNull();
    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });

  it("links each row's own athlete when two rows are linked before the links prop refreshes (QA-06)", () => {
    const RACE_ROW_A_ID = "ckathlrace0000000000000aaa";
    const RACE_ROW_B_ID = "ckathlrace0000000000000bbb";

    athletesState.data = {
      athletes: [
        makeAthlete({ userId: RACE_ROW_A_ID, name: "Aaron Race" }),
        makeAthlete({ userId: RACE_ROW_B_ID, name: "Zoe Race" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: RACE_ROW_A_ID }),
      makeEnrollment({ id: "ckenrl0000000000000race00", athleteId: RACE_ROW_B_ID }),
    ];
    mobileAthletesState.data = [{ athleteId: RACE_ROW_A_ID }, { athleteId: RACE_ROW_B_ID }];

    renderSection([]);

    const [firstLink, secondLink] = screen.getAllByRole("button", { name: "Link" });

    if (firstLink === undefined || secondLink === undefined) {
      throw new Error("expected two linkable athlete rows");
    }

    fireEvent.click(firstLink);
    fireEvent.click(secondLink);

    expect(createLinkMutate).toHaveBeenCalledTimes(2);
    expect(createLinkMutate).toHaveBeenNthCalledWith(1, {
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: RACE_ROW_A_ID,
    });
    expect(createLinkMutate).toHaveBeenNthCalledWith(2, {
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: RACE_ROW_B_ID,
    });
  });

  it("renders the publish status of each linked athlete row (MP-22)", () => {
    const PUBLISHED_AT = new Date(new Date().getFullYear(), 5, 11, 12);

    enrolLinkedAndUnlinked();

    renderSection([
      makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID }),
      makeIndividualLink({
        id: "cklink0000000000000000pub0",
        athleteId: UNLINKED_ATHLETE_ID,
        publishedDayCount: 7,
        lastPublishedAt: PUBLISHED_AT,
      }),
    ]);

    expect(screen.getByText("Never published")).toBeInTheDocument();
    expect(
      screen.getByText(`Last published ${formatDate(PUBLISHED_AT, "day")}`),
    ).toBeInTheDocument();
  });
});
