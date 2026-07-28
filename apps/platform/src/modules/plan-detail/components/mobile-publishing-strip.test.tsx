import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import type { LegacyTrainingLevel } from "@repo/contracts/coaching/legacy-mobile";
import type { MobileConnection } from "@repo/contracts/coaching/mobile-connection";
import type { MobileLink } from "@repo/contracts/coaching/mobile-link";

import {
  makeIndividualLink,
  makeMobileConnection,
  makeMobileLink,
  trainingLevelsFixture,
} from "@app/lib/mobile.fixtures";
import { render } from "@app/test/render";

type QueryState<TData> = {
  data: TData | undefined;
  isPending: boolean;
};

const connectionsState: QueryState<MobileConnection[]> = {
  data: [makeMobileConnection()],
  isPending: false,
};
const levelsState: QueryState<LegacyTrainingLevel[]> = {
  data: trainingLevelsFixture,
  isPending: false,
};
const linksState: QueryState<MobileLink[]> = { data: [], isPending: false };
const mobileLinksSpy = vi.fn<(planId: string, weekStart?: string) => void>();

type RosterAthlete = Pick<CoachAthleteListItem, "userId" | "name" | "email">;

const ALICE: RosterAthlete = {
  userId: "ckathl1234567890abcdef0123",
  name: "Alice Stone",
  email: "alice@example.com",
};
const coachAthletesState: QueryState<{ athletes: RosterAthlete[] }> = {
  data: { athletes: [ALICE] },
  isPending: false,
};

vi.mock("@app/lib/hooks", () => ({
  useCoachAthletes: () => coachAthletesState,
  useMobileConnections: () => connectionsState,
  useTrainingLevels: () => levelsState,
  useMobileLinks: (planId: string, weekStart?: string) => {
    mobileLinksSpy(planId, weekStart);

    return linksState;
  },
}));

vi.mock("./manage-mobile-links-modal", () => ({
  ManageMobileLinksModal: () => null,
}));

vi.mock("./publish-week-modal", () => ({
  PublishWeekModal: () => null,
}));

const { MobilePublishingStrip } = await import("./mobile-publishing-strip");

const PLAN_ID = "ckplan1234567890abcdef0123";
const MONDAY = new Date(2026, 0, 5);
const MONDAY_PARAM = "2026-01-05";
const PUBLISH_BUTTON_NAME = "Publish this week";
const PUBLISH_DISABLED_TOOLTIP = "Link a training level or athlete first";
const PUBLISH_WEEK_SCOPE_TOOLTIP = "Sends only the week you have open";
const WEEK_PUBLISHED_AT = new Date(2026, 0, 5, 12);
const LIFETIME_PUBLISHED_AT = new Date(2025, 10, 20, 12);
const LIFETIME_DAY_COUNT = 8;
const WEEK_DAY_COUNT = 5;
const NEVER_PUBLISHED = { publishedDayCount: 0, lastPublishedAt: null };
const PUBLISHED_THIS_WEEK = {
  publishedDayCount: WEEK_DAY_COUNT,
  lastPublishedAt: WEEK_PUBLISHED_AT,
};
const PUBLISHED_BEFORE = {
  publishedDayCount: LIFETIME_DAY_COUNT,
  lastPublishedAt: LIFETIME_PUBLISHED_AT,
};

const renderStrip = () => render(<MobilePublishingStrip planId={PLAN_ID} monday={MONDAY} />);

const hoverPublishTooltip = async (): Promise<HTMLElement> => {
  const publishButton = screen.getByRole("button", { name: PUBLISH_BUTTON_NAME });

  fireEvent.mouseOver(publishButton.parentElement ?? publishButton);

  return screen.findByRole("tooltip");
};

beforeEach(() => {
  connectionsState.data = [makeMobileConnection()];
  connectionsState.isPending = false;
  levelsState.data = trainingLevelsFixture;
  levelsState.isPending = false;
  linksState.data = [];
  linksState.isPending = false;
  coachAthletesState.data = { athletes: [ALICE] };
  coachAthletesState.isPending = false;
  mobileLinksSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MobilePublishingStrip (MT-14)", () => {
  it("shows 'Not linked' and disables Publish when there are no links", () => {
    linksState.data = [];

    renderStrip();

    expect(screen.getByText("Not linked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeDisabled();
  });

  it("lists the linked level names when names resolve", () => {
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", legacyLevelId: 2 }),
      makeMobileLink({ id: "cklink3000000000000000000a", legacyLevelId: 3 }),
    ];

    renderStrip();

    expect(screen.getByText("Publishes to: Pro, RX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeEnabled();
  });

  it("falls back to a level count when training levels are unavailable", () => {
    levelsState.data = undefined;
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", legacyLevelId: 2 }),
      makeMobileLink({ id: "cklink3000000000000000000a", legacyLevelId: 3 }),
    ];

    renderStrip();

    expect(screen.getByText("2 levels")).toBeInTheDocument();
  });

  it("renders nothing while the connections or links queries are pending", () => {
    linksState.isPending = true;

    const { container } = renderStrip();

    expect(container).toBeEmptyDOMElement();
  });
});

describe("MobilePublishingStrip individual + mixed channels", () => {
  it("lists individual athlete names and enables Publish when only individual links exist", () => {
    linksState.data = [makeIndividualLink()];

    renderStrip();

    expect(screen.getByText("Publishes to: Alice Stone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeEnabled();
  });

  it("labels both channels when general and individual links coexist", () => {
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", legacyLevelId: 2 }),
      makeIndividualLink({ id: "cklink9000000000000000000a" }),
    ];

    renderStrip();

    expect(screen.getByText("Levels: Pro · Athletes: Alice Stone")).toBeInTheDocument();
  });

  it("falls back to an athlete count when a roster name is unavailable", () => {
    coachAthletesState.data = { athletes: [] };
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", legacyLevelId: 2 }),
      makeIndividualLink({ id: "cklink9000000000000000000a" }),
    ];

    renderStrip();

    expect(screen.getByText("Levels: Pro · Athletes: 1 athlete")).toBeInTheDocument();
  });

  it("shows an athlete count without the 'Publishes to:' prefix when an individual-only link is unresolved (MT-2)", () => {
    coachAthletesState.data = { athletes: [] };
    linksState.data = [makeIndividualLink()];

    renderStrip();

    expect(screen.getByText("1 athlete")).toBeInTheDocument();
    expect(screen.queryByText(/Publishes to:/)).toBeNull();
  });

  it("labels both channels by count when neither level names nor roster names resolve (MT-2)", () => {
    levelsState.data = undefined;
    coachAthletesState.data = { athletes: [] };
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", legacyLevelId: 2 }),
      makeMobileLink({ id: "cklink3000000000000000000a", legacyLevelId: 3 }),
      makeIndividualLink({
        id: "cklink9000000000000000000a",
        athleteId: "ckathl9000000000000000000a",
        legacyUserId: 101,
      }),
      makeIndividualLink({
        id: "cklink8000000000000000000a",
        athleteId: "ckathl8000000000000000000a",
        legacyUserId: 102,
      }),
    ];

    renderStrip();

    expect(screen.getByText("Levels: 2 levels · Athletes: 2 athletes")).toBeInTheDocument();
  });

  it("uses the athlete email in the status line when the roster name is null (MT-2)", () => {
    const emailOnlyUserId = "ckathlemail00000000000000a";

    coachAthletesState.data = {
      athletes: [{ userId: emailOnlyUserId, name: null, email: "ghost@example.com" }],
    };
    linksState.data = [makeIndividualLink({ athleteId: emailOnlyUserId })];

    renderStrip();

    expect(screen.getByText("Publishes to: ghost@example.com")).toBeInTheDocument();
  });
});

describe("MobilePublishingStrip publish status (MP-22)", () => {
  it("subscribes to the links query scoped to the week the coach has open", () => {
    renderStrip();

    expect(mobileLinksSpy).toHaveBeenCalledWith(PLAN_ID, MONDAY_PARAM);
  });

  it("warns that a link has never published without the coach opening Manage", () => {
    linksState.data = [makeMobileLink({ weekPublish: NEVER_PUBLISHED })];

    renderStrip();

    expect(screen.getByText("Never published")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeEnabled();
  });

  it("counts the never-published links honestly when the others already went out", () => {
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", weekPublish: NEVER_PUBLISHED }),
      makeMobileLink({
        id: "cklink3000000000000000000a",
        legacyLevelId: 3,
        ...PUBLISHED_BEFORE,
        weekPublish: PUBLISHED_THIS_WEEK,
      }),
    ];

    renderStrip();

    expect(screen.getByText("1 never published")).toBeInTheDocument();
    expect(screen.getByText("This week published Jan 5")).toBeInTheDocument();
  });

  it("flags the open week as pending when every link published before but not this week", () => {
    linksState.data = [
      makeMobileLink({
        id: "cklink2000000000000000000a",
        ...PUBLISHED_BEFORE,
        weekPublish: NEVER_PUBLISHED,
      }),
      makeMobileLink({
        id: "cklink3000000000000000000a",
        legacyLevelId: 3,
        ...PUBLISHED_BEFORE,
        weekPublish: NEVER_PUBLISHED,
      }),
    ];

    renderStrip();

    expect(screen.getByText("This week not published yet")).toBeInTheDocument();
  });

  it("confirms the week publish date once every link has gone out this week", () => {
    linksState.data = [makeMobileLink({ ...PUBLISHED_BEFORE, weekPublish: PUBLISHED_THIS_WEEK })];

    renderStrip();

    expect(screen.getByText("This week published Jan 5")).toBeInTheDocument();
    expect(screen.queryByText("Never published")).toBeNull();
  });

  it("explains what to link first when Publish is disabled", async () => {
    linksState.data = [];

    renderStrip();

    expect(await hoverPublishTooltip()).toHaveTextContent(PUBLISH_DISABLED_TOOLTIP);
  });

  it("spells out the week scope on the enabled Publish button", async () => {
    linksState.data = [makeMobileLink()];

    renderStrip();

    expect(await hoverPublishTooltip()).toHaveTextContent(PUBLISH_WEEK_SCOPE_TOOLTIP);
  });
});
