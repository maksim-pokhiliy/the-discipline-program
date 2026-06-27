import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import { ProcessStatus } from "@repo/contracts/coaching/coach-dashboard";
import type { MobileAthlete } from "@repo/contracts/coaching/legacy-mobile";
import type { IndividualMobileLink } from "@repo/contracts/coaching/mobile-link";
import { MOBILE_RECONNECT_REQUIRED } from "@repo/contracts/coaching/mobile-publish";
import { EnrollmentStatus, type PlanEnrollment } from "@repo/contracts/lms/plan-enrollment";

import { makeIndividualLink, mobileAthletesFixture } from "@app/lib/mobile.fixtures";
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
const LINK_ID = "cklink1234567890abcdef0123";
const ORPHAN_LINK_ID = "cklink00000000000000orphan";
const NOW = new Date("2026-01-05T00:00:00.000Z");

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
const mobileAthletesState: QueryState<MobileAthlete[]> = {
  data: mobileAthletesFixture,
  error: null,
  isError: false,
  isPending: false,
};

const createLinkMutate = vi.fn();
const deleteLinkMutate = vi.fn();

vi.mock("@app/lib/hooks", () => ({
  usePlanEnrollments: () => enrollmentsState,
  useCoachAthletes: () => athletesState,
  useMobileAthletes: () => mobileAthletesState,
  useCreateMobileLink: () => ({ mutate: createLinkMutate, isPending: false }),
  useDeleteMobileLink: () => ({ mutate: deleteLinkMutate, isPending: false }),
}));

vi.mock("../../coach-profile/components", () => ({
  ConnectMobileModal: ({ open }: { open: boolean }) =>
    open ? <div>connect-modal-open</div> : null,
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

const reconnectError = (): Error => {
  const error = new Error("Session expired");

  Object.assign(error, { details: { reason: MOBILE_RECONNECT_REQUIRED } });

  return error;
};

const renderSection = (individualLinks: IndividualMobileLink[] = []) =>
  render(<IndividualLinksSection planId={PLAN_ID} isConnected individualLinks={individualLinks} />);

beforeEach(() => {
  enrollmentsState.data = [];
  enrollmentsState.error = null;
  enrollmentsState.isError = false;
  enrollmentsState.isPending = false;
  athletesState.data = { athletes: [] };
  athletesState.error = null;
  athletesState.isError = false;
  athletesState.isPending = false;
  mobileAthletesState.data = mobileAthletesFixture;
  mobileAthletesState.error = null;
  mobileAthletesState.isError = false;
  mobileAthletesState.isPending = false;
  createLinkMutate.mockReset();
  deleteLinkMutate.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IndividualLinksSection (T6)", () => {
  it("renders a floating-label Select for an enrolled, unlinked athlete and links the picked legacy athlete (T6-a)", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" })],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
    ];

    renderSection([]);

    const select = screen.getByRole("combobox", { name: "Link mobile athlete" });

    expect(select).toBeInTheDocument();

    fireEvent.mouseDown(select);
    fireEvent.click(
      within(screen.getByRole("listbox")).getByRole("option", { name: /Alice Stone/ }),
    );

    expect(createLinkMutate).toHaveBeenCalledWith({
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: LINKED_ATHLETE_ID,
      legacyUserId: 101,
    });
  });

  it("omits an already-linked legacy athlete from the picker options (T6-b)", () => {
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Linked Athlete" }),
        makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Pat Platform" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
      makeEnrollment({
        id: "ckenrl0000000000000000pat0",
        athleteId: UNLINKED_ATHLETE_ID,
        status: EnrollmentStatus.ACTIVE,
      }),
    ];

    renderSection([makeIndividualLink({ athleteId: LINKED_ATHLETE_ID, legacyUserId: 101 })]);

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Link mobile athlete" }));

    const listbox = screen.getByRole("listbox");

    expect(within(listbox).queryByRole("option", { name: /@alice/ })).toBeNull();
    expect(within(listbox).getByRole("option", { name: /@bob/ })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: /@charlie/ })).toBeInTheDocument();
  });

  it("shows the platform name plus paired legacy identity and unlinks on danger confirm (T6-c)", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" })],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
    ];

    renderSection([
      makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID, legacyUserId: 101 }),
    ]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.getByText(/Mobile: Alice Stone · @alice/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unlink mobile athlete" }));

    const dialog = screen.getByRole("dialog", { name: /Unlink mobile athlete\?/ });

    fireEvent.click(within(dialog).getByRole("button", { name: "Unlink" }));

    expect(deleteLinkMutate).toHaveBeenCalledWith(LINK_ID);
  });

  it("renders and unlinks an orphan link whose athlete is no longer enrolled (T6-d)", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: ORPHAN_ATHLETE_ID, name: "Orphan Athlete" })],
    };
    enrollmentsState.data = [];

    renderSection([
      makeIndividualLink({ id: ORPHAN_LINK_ID, athleteId: ORPHAN_ATHLETE_ID, legacyUserId: 102 }),
    ]);

    expect(screen.getByText("Orphan Athlete")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unlink mobile athlete" }));

    const dialog = screen.getByRole("dialog", { name: /Unlink mobile athlete\?/ });

    fireEvent.click(within(dialog).getByRole("button", { name: "Unlink" }));

    expect(deleteLinkMutate).toHaveBeenCalledWith(ORPHAN_LINK_ID);
  });

  it("keeps the linked row unlinkable and shows the Reconnect CTA in place of the picker when the live list is reconnect-required (T6-e)", () => {
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" }),
        makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Sam Athlete" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
      makeEnrollment({
        id: "ckenrl0000000000000000pat0",
        athleteId: UNLINKED_ATHLETE_ID,
        status: EnrollmentStatus.ACTIVE,
      }),
    ];
    mobileAthletesState.data = undefined;
    mobileAthletesState.error = reconnectError();
    mobileAthletesState.isError = true;

    renderSection([
      makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID, legacyUserId: 101 }),
    ]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Link mobile athlete" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));

    expect(screen.getByText("connect-modal-open")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Unlink mobile athlete" }));

    const dialog = screen.getByRole("dialog", { name: /Unlink mobile athlete\?/ });

    fireEvent.click(within(dialog).getByRole("button", { name: "Unlink" }));

    expect(deleteLinkMutate).toHaveBeenCalledWith(LINK_ID);
  });

  it("keeps the linked row unlinkable and shows the error alert in place of the picker on a non-reconnect error (T6-f)", () => {
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" }),
        makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Sam Athlete" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
      makeEnrollment({
        id: "ckenrl0000000000000000pat0",
        athleteId: UNLINKED_ATHLETE_ID,
        status: EnrollmentStatus.ACTIVE,
      }),
    ];
    mobileAthletesState.data = undefined;
    mobileAthletesState.error = new Error("legacy 500");
    mobileAthletesState.isError = true;

    renderSection([
      makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID, legacyUserId: 101 }),
    ]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.getByText("Couldn't load athletes. Try again.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Link mobile athlete" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Unlink mobile athlete" }));

    const dialog = screen.getByRole("dialog", { name: /Unlink mobile athlete\?/ });

    fireEvent.click(within(dialog).getByRole("button", { name: "Unlink" }));

    expect(deleteLinkMutate).toHaveBeenCalledWith(LINK_ID);
  });

  it("shows a no-athletes hint instead of a dead picker when the live list is empty (QA-05)", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" })],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
    ];
    mobileAthletesState.data = [];

    renderSection([]);

    expect(screen.getByText("No mobile athletes found.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Link mobile athlete" })).toBeNull();
  });

  it("shows an all-linked hint instead of a dead picker when every legacy athlete is taken (QA-05)", () => {
    athletesState.data = {
      athletes: [
        makeAthlete({ userId: UNLINKED_ATHLETE_ID, name: "Pat Platform" }),
        makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Linked Athlete" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: UNLINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
    ];
    mobileAthletesState.data = [
      { id: 101, username: "alice", firstName: "Alice", lastName: "Stone" },
    ];

    renderSection([
      makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID, legacyUserId: 101 }),
    ]);

    expect(screen.getByText("Every mobile athlete is already linked.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Link mobile athlete" })).toBeNull();
  });

  it("shows a spinner instead of the empty-state flash while the roster is still loading (QA-07)", () => {
    enrollmentsState.data = undefined;
    enrollmentsState.isPending = true;
    athletesState.data = undefined;
    athletesState.isPending = true;

    renderSection([]);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("No enrolled athletes to link yet.")).toBeNull();
  });

  it("shows a spinner instead of an Unknown athlete flash while the roster is still loading (QA-07)", () => {
    enrollmentsState.data = undefined;
    enrollmentsState.isPending = true;
    athletesState.data = undefined;
    athletesState.isPending = true;

    renderSection([
      makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID, legacyUserId: 101 }),
    ]);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Unknown athlete")).toBeNull();
    expect(screen.queryByText("No enrolled athletes to link yet.")).toBeNull();
  });

  it("fires a second create for the same legacy id on a different row while the links prop has not yet refreshed (QA-06, MT-9)", () => {
    const RACE_ROW_A_ID = "ckathlrace0000000000000aaa";
    const RACE_ROW_B_ID = "ckathlrace0000000000000bbb";

    athletesState.data = {
      athletes: [
        makeAthlete({ userId: RACE_ROW_A_ID, name: "Aaron Race" }),
        makeAthlete({ userId: RACE_ROW_B_ID, name: "Zoe Race" }),
      ],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: RACE_ROW_A_ID, status: EnrollmentStatus.ACTIVE }),
      makeEnrollment({
        id: "ckenrl0000000000000race00",
        athleteId: RACE_ROW_B_ID,
        status: EnrollmentStatus.ACTIVE,
      }),
    ];

    renderSection([]);

    const [firstSelect, secondSelect] = screen.getAllByRole("combobox", {
      name: "Link mobile athlete",
    });

    if (firstSelect === undefined || secondSelect === undefined) {
      throw new Error("expected two unlinked athlete rows");
    }

    fireEvent.mouseDown(firstSelect);
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: /@alice/ }));

    fireEvent.mouseDown(secondSelect);
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: /@alice/ }));

    expect(createLinkMutate).toHaveBeenCalledTimes(2);
    expect(createLinkMutate).toHaveBeenNthCalledWith(1, {
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: RACE_ROW_A_ID,
      legacyUserId: 101,
    });
    expect(createLinkMutate).toHaveBeenNthCalledWith(2, {
      planId: PLAN_ID,
      channel: "INDIVIDUAL",
      athleteId: RACE_ROW_B_ID,
      legacyUserId: 101,
    });
  });

  it("shows a skeleton for the linked legacy identity instead of the raw #id while the live list is still loading (flash fix)", () => {
    athletesState.data = {
      athletes: [makeAthlete({ userId: LINKED_ATHLETE_ID, name: "Pat Platform" })],
    };
    enrollmentsState.data = [
      makeEnrollment({ athleteId: LINKED_ATHLETE_ID, status: EnrollmentStatus.ACTIVE }),
    ];
    mobileAthletesState.data = undefined;
    mobileAthletesState.isPending = true;

    const { container } = renderSection([
      makeIndividualLink({ id: LINK_ID, athleteId: LINKED_ATHLETE_ID, legacyUserId: 101 }),
    ]);

    expect(screen.getByText("Pat Platform")).toBeInTheDocument();
    expect(screen.queryByText(/Mobile: #101/)).toBeNull();
    expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
  });
});
