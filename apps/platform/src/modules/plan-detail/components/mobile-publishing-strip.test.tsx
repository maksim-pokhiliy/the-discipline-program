import { fireEvent, type RenderResult, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachAthleteListItem } from "@repo/contracts/coaching/coach-athletes";
import type { LegacyTrainingLevel } from "@repo/contracts/coaching/legacy-mobile";
import type { MobileConnection } from "@repo/contracts/coaching/mobile-connection";
import type { MobileLink } from "@repo/contracts/coaching/mobile-link";
import { formatDate } from "@repo/shared";

import {
  makeIndividualLink,
  makeMobileConnection,
  makeMobileLink,
  trainingLevelsFixture,
} from "@app/lib/mobile.fixtures";
import { render } from "@app/test/render";

type QueryState<TData> = {
  data: TData | undefined;
  isError: boolean;
  isPending: boolean;
  isPlaceholderData: boolean;
};

const connectionsState: QueryState<MobileConnection[]> = {
  data: [makeMobileConnection()],
  isError: false,
  isPending: false,
  isPlaceholderData: false,
};
const levelsState: QueryState<LegacyTrainingLevel[]> = {
  data: trainingLevelsFixture,
  isError: false,
  isPending: false,
  isPlaceholderData: false,
};
const linksState: QueryState<MobileLink[]> = {
  data: [],
  isError: false,
  isPending: false,
  isPlaceholderData: false,
};
const mobileLinksSpy = vi.fn<(planId: string, weekStart?: string) => void>();
const manageModalSpy =
  vi.fn<(props: { planId: string; weekStart: string; open: boolean }) => void>();
const publishModalSpy = vi.fn<(props: { open: boolean }) => void>();

type RosterAthlete = Pick<CoachAthleteListItem, "userId" | "name" | "email">;

const ALICE: RosterAthlete = {
  userId: "ckathl1234567890abcdef0123",
  name: "Alice Stone",
  email: "alice@example.com",
};
const coachAthletesState: QueryState<{ athletes: RosterAthlete[] }> = {
  data: { athletes: [ALICE] },
  isError: false,
  isPending: false,
  isPlaceholderData: false,
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
  ManageMobileLinksModal: (props: { planId: string; weekStart: string; open: boolean }) => {
    manageModalSpy(props);

    return null;
  },
}));

vi.mock("./publish-week-modal", () => ({
  PublishWeekModal: (props: { open: boolean }) => {
    publishModalSpy(props);

    return <div data-testid="publish-week-modal" data-open={String(props.open)} />;
  },
}));

const { MobilePublishingStrip } = await import("./mobile-publishing-strip");

const PLAN_ID = "ckplan1234567890abcdef0123";
const MONDAY = new Date(2026, 0, 5);
const MONDAY_PARAM = "2026-01-05";
const PUBLISH_BUTTON_NAME = "Publish this week";
const PUBLISH_DISABLED_TOOLTIP = "Link a training level or athlete first";
const PUBLISH_WEEK_SCOPE_TOOLTIP = "Sends only the week you have open";
const LINKS_ERROR_LABEL = "Couldn't load the publishing status";
const LINKS_ERROR_TOOLTIP = "Can't publish until the publishing status loads";
const CHECKING_LABEL = "Checking this week…";
const CURRENT_YEAR = new Date().getFullYear();
const WEEK_PUBLISHED_AT = new Date(CURRENT_YEAR, 0, 5, 12);
const LIFETIME_PUBLISHED_AT = new Date(CURRENT_YEAR - 1, 10, 20, 12);
const WEEK_SENT_CAPTION = `This week: sent ${formatDate(WEEK_PUBLISHED_AT, "day")}`;
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

const stripFor = (hasWeekContent: boolean) => (
  <MobilePublishingStrip planId={PLAN_ID} monday={MONDAY} hasWeekContent={hasWeekContent} />
);

const renderStrip = () => render(stripFor(true));

const hoverPublishTooltip = async (): Promise<HTMLElement> => {
  const publishButton = screen.getByRole("button", { name: PUBLISH_BUTTON_NAME });

  fireEvent.mouseOver(publishButton.parentElement ?? publishButton);

  return screen.findByRole("tooltip");
};

beforeEach(() => {
  connectionsState.data = [makeMobileConnection()];
  connectionsState.isError = false;
  connectionsState.isPending = false;
  levelsState.data = trainingLevelsFixture;
  levelsState.isError = false;
  levelsState.isPending = false;
  linksState.data = [];
  linksState.isError = false;
  linksState.isPending = false;
  linksState.isPlaceholderData = false;
  coachAthletesState.data = { athletes: [ALICE] };
  coachAthletesState.isError = false;
  coachAthletesState.isPending = false;
  mobileLinksSpy.mockClear();
  manageModalSpy.mockClear();
  publishModalSpy.mockClear();
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

  it("hides the card while the connections or links queries are pending", () => {
    linksState.isPending = true;

    renderStrip();

    expect(screen.queryByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeNull();
    expect(screen.queryByText("Mobile publishing")).toBeNull();
  });
});

describe("MobilePublishingStrip modal lifetime (F2)", () => {
  const hideStripWith = (hide: () => void, view: RenderResult) => {
    linksState.data = [makeMobileLink()];

    fireEvent.click(screen.getByRole("button", { name: PUBLISH_BUTTON_NAME }));

    expect(screen.getByTestId("publish-week-modal")).toHaveAttribute("data-open", "true");

    manageModalSpy.mockClear();
    hide();
    view.rerender(stripFor(true));
  };

  beforeEach(() => {
    linksState.data = [makeMobileLink()];
  });

  it("keeps both modals mounted while the connections query is pending", () => {
    const view = renderStrip();

    hideStripWith(() => {
      connectionsState.isPending = true;
    }, view);

    expect(screen.queryByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeNull();
    expect(screen.getByTestId("publish-week-modal")).toHaveAttribute("data-open", "true");
    expect(manageModalSpy).toHaveBeenCalled();
  });

  it("keeps both modals mounted while the links query is pending", () => {
    const view = renderStrip();

    hideStripWith(() => {
      linksState.isPending = true;
    }, view);

    expect(screen.queryByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeNull();
    expect(screen.getByTestId("publish-week-modal")).toHaveAttribute("data-open", "true");
    expect(manageModalSpy).toHaveBeenCalled();
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
    expect(screen.getByText(WEEK_SENT_CAPTION)).toBeInTheDocument();
  });

  it("surfaces the week-pending count alongside the never-published warning (F4)", () => {
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", weekPublish: NEVER_PUBLISHED }),
      ...[3, 4, 5].map((legacyLevelId) =>
        makeMobileLink({
          id: `cklink${legacyLevelId}000000000000000000`,
          legacyLevelId,
          ...PUBLISHED_BEFORE,
          weekPublish: NEVER_PUBLISHED,
        }),
      ),
    ];

    renderStrip();

    expect(screen.getByText("1 never published")).toBeInTheDocument();
    expect(screen.getByText("3 not published this week")).toBeInTheDocument();
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

  it("reports only when the week was last sent, never that the week is complete (F5)", () => {
    linksState.data = [makeMobileLink({ ...PUBLISHED_BEFORE, weekPublish: PUBLISHED_THIS_WEEK })];

    renderStrip();

    expect(screen.getByText(WEEK_SENT_CAPTION)).toBeInTheDocument();
    expect(screen.queryByText(/This week published/)).toBeNull();
    expect(screen.queryByText("Never published")).toBeNull();
  });

  it("says it is still checking rather than showing last week's status as this week's (F1, F8)", () => {
    linksState.data = [makeMobileLink({ weekPublish: NEVER_PUBLISHED })];
    linksState.isPlaceholderData = true;

    renderStrip();

    expect(screen.queryByText("Never published")).toBeNull();
    expect(screen.queryByText(/not published this week/)).toBeNull();
    expect(screen.queryByText(/This week: sent/)).toBeNull();
    expect(screen.getByText(CHECKING_LABEL)).toBeInTheDocument();
    expect(screen.getByText("Publishes to: Pro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeEnabled();
  });

  it("hands the Manage modal the same week the strip subscribes to (F7)", () => {
    linksState.data = [makeMobileLink()];

    renderStrip();

    expect(mobileLinksSpy).toHaveBeenCalledWith(PLAN_ID, MONDAY_PARAM);
    expect(manageModalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ planId: PLAN_ID, weekStart: MONDAY_PARAM }),
    );
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

describe("MobilePublishingStrip failed links fetch (F4)", () => {
  beforeEach(() => {
    linksState.data = undefined;
    linksState.isError = true;
  });

  it("never claims a linked plan is 'Not linked' when the fetch failed", () => {
    renderStrip();

    expect(screen.queryByText("Not linked")).toBeNull();
    expect(screen.getByText(LINKS_ERROR_LABEL)).toBeInTheDocument();
  });

  it("blames the failed load, not a missing link, for the disabled Publish button", async () => {
    renderStrip();

    expect(screen.getByRole("button", { name: PUBLISH_BUTTON_NAME })).toBeDisabled();

    const tooltip = await hoverPublishTooltip();

    expect(tooltip).toHaveTextContent(LINKS_ERROR_TOOLTIP);
    expect(tooltip).not.toHaveTextContent(PUBLISH_DISABLED_TOOLTIP);
  });

  it("shows no publish status at all rather than an all-clear", () => {
    renderStrip();

    expect(screen.queryByText("Never published")).toBeNull();
    expect(screen.queryByText(CHECKING_LABEL)).toBeNull();
    expect(screen.queryByText(/This week: sent/)).toBeNull();
  });
});

describe("MobilePublishingStrip on a week with no content (F7)", () => {
  it("does not flag an empty week as unpublished", () => {
    linksState.data = [
      makeMobileLink({ ...PUBLISHED_BEFORE, weekPublish: NEVER_PUBLISHED }),
      makeMobileLink({
        id: "cklink3000000000000000000a",
        legacyLevelId: 3,
        ...PUBLISHED_BEFORE,
        weekPublish: NEVER_PUBLISHED,
      }),
    ];

    render(stripFor(false));

    expect(screen.queryByText("This week not published yet")).toBeNull();
    expect(screen.queryByText(/not published this week/)).toBeNull();
  });

  it("still warns about a link that has never published on an empty week", () => {
    linksState.data = [makeMobileLink({ weekPublish: NEVER_PUBLISHED })];

    render(stripFor(false));

    expect(screen.getByText("Never published")).toBeInTheDocument();
  });
});
