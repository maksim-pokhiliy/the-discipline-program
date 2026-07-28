import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LegacyTrainingLevel } from "@repo/contracts/coaching/legacy-mobile";
import type { MobileConnection } from "@repo/contracts/coaching/mobile-connection";
import type { MobileLink } from "@repo/contracts/coaching/mobile-link";
import { MOBILE_RECONNECT_REQUIRED } from "@repo/contracts/coaching/mobile-publish";
import { formatDate } from "@repo/shared";

import {
  makeMobileConnection,
  makeMobileLink,
  trainingLevelsFixture,
} from "@app/lib/mobile.fixtures";
import { render } from "@app/test/render";

type QueryState<TData> = {
  data: TData | undefined;
  error: Error | null;
  isError: boolean;
  isPending: boolean;
};

const connectionsState: QueryState<MobileConnection[]> = {
  data: [makeMobileConnection()],
  error: null,
  isError: false,
  isPending: false,
};
const levelsState: QueryState<LegacyTrainingLevel[]> = {
  data: trainingLevelsFixture,
  error: null,
  isError: false,
  isPending: false,
};
const linksState: QueryState<MobileLink[]> = {
  data: [],
  error: null,
  isError: false,
  isPending: false,
};

const createLinkMutate = vi.fn();
const deleteLinkMutate = vi.fn();
const mobileLinksSpy = vi.fn<(planId: string, weekStart?: string) => void>();

vi.mock("@app/lib/hooks", () => ({
  useMobileConnections: () => connectionsState,
  useTrainingLevels: () => levelsState,
  useMobileLinks: (planId: string, weekStart?: string) => {
    mobileLinksSpy(planId, weekStart);

    return linksState;
  },
  useCreateMobileLink: () => ({ mutate: createLinkMutate, isPending: false }),
  useDeleteMobileLink: () => ({ mutate: deleteLinkMutate, isPending: false }),
}));

vi.mock("../../coach-profile/components", () => ({
  ConnectMobileModal: ({ open }: { open: boolean }) =>
    open ? <div>connect-modal-open</div> : null,
}));

vi.mock("./individual-links-section", () => ({ IndividualLinksSection: () => null }));

const { ManageMobileLinksModal } = await import("./manage-mobile-links-modal");

const PLAN_ID = "ckplan1234567890abcdef0123";
const WEEK_START = "2026-01-05";
const RECONNECT_MESSAGE = "Connection expired. Reconnect to manage training levels.";
const LEVELS_ERROR_MESSAGE = "Couldn't load training levels. Try again.";
const LINKS_ERROR_MESSAGE = "Couldn't load what this plan is linked to. Try again.";
const ALL_LINKED_MESSAGE = "Every training level is already linked.";
const NO_LINKS_MESSAGE = "No training levels linked yet.";

const reconnectError = (): Error => {
  const error = new Error("Session expired");

  Object.assign(error, { details: { reason: MOBILE_RECONNECT_REQUIRED } });

  return error;
};

const renderModal = () =>
  render(<ManageMobileLinksModal open onClose={vi.fn()} planId={PLAN_ID} weekStart={WEEK_START} />);

beforeEach(() => {
  connectionsState.data = [makeMobileConnection()];
  connectionsState.error = null;
  connectionsState.isError = false;
  connectionsState.isPending = false;
  levelsState.data = trainingLevelsFixture;
  levelsState.error = null;
  levelsState.isError = false;
  levelsState.isPending = false;
  linksState.data = [];
  linksState.error = null;
  linksState.isError = false;
  linksState.isPending = false;
  createLinkMutate.mockReset();
  deleteLinkMutate.mockReset();
  mobileLinksSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ManageMobileLinksModal (MT-12)", () => {
  it("renders the connect CTA when not connected", () => {
    connectionsState.data = [];

    renderModal();

    expect(screen.getByRole("button", { name: "Connect mobile app" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Training level")).toBeNull();
  });

  it("renders the Reconnect CTA (not the picker) on a reconnect-required levels error", () => {
    levelsState.data = undefined;
    levelsState.error = reconnectError();
    levelsState.isError = true;

    renderModal();

    expect(screen.getByText(RECONNECT_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Training level")).toBeNull();
  });

  it("renders the error alert (not a silent empty picker) on a non-reconnect levels error (QA-013)", () => {
    levelsState.data = undefined;
    levelsState.error = new Error("legacy 500");
    levelsState.isError = true;

    renderModal();

    expect(screen.getByText(LEVELS_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
  });

  it("disables the Select and shows the all-linked caption when every level is linked", () => {
    linksState.data = trainingLevelsFixture.map((level) =>
      makeMobileLink({ id: `cklink${level.id}000000000000000000`, legacyLevelId: level.id }),
    );

    renderModal();

    expect(screen.getByText(ALL_LINKED_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("does not call deleteLink when the delete confirmation is cancelled (QA-021)", () => {
    linksState.data = [makeMobileLink({ legacyLevelId: 2 })];

    renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Unlink training level" }));

    const dialog = screen.getByRole("dialog", { name: /Unlink training level\?/ });

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(deleteLinkMutate).not.toHaveBeenCalled();
  });
});

describe("ManageMobileLinksModal shared links cache (F7)", () => {
  it("subscribes to the same week-scoped links key the strip already warmed", () => {
    renderModal();

    expect(mobileLinksSpy).toHaveBeenCalledWith(PLAN_ID, WEEK_START);
  });

  it("waits for the links query instead of claiming nothing is linked yet", () => {
    linksState.data = undefined;
    linksState.isPending = true;

    renderModal();

    expect(screen.queryByText(NO_LINKS_MESSAGE)).toBeNull();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("says nothing is linked only once the links query has actually answered", () => {
    linksState.data = [];
    linksState.isPending = false;

    renderModal();

    expect(screen.getByText(NO_LINKS_MESSAGE)).toBeInTheDocument();
  });
});

describe("ManageMobileLinksModal failed links fetch (F5)", () => {
  beforeEach(() => {
    linksState.data = undefined;
    linksState.error = new Error("links 500");
    linksState.isError = true;
  });

  it("does not claim nothing is linked yet when the links fetch failed", () => {
    renderModal();

    expect(screen.getByText(LINKS_ERROR_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(NO_LINKS_MESSAGE)).toBeNull();
  });

  it("does not invite the coach to re-add levels that may already be linked", () => {
    renderModal();

    expect(screen.queryByLabelText("Training level")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull();
  });
});

describe("ManageMobileLinksModal row publish status (MP-22)", () => {
  const PUBLISHED_AT = new Date(new Date().getFullYear(), 5, 11, 12);
  const PUBLISHED_DAY_COUNT = 12;

  it("warns on a training level that has never published", () => {
    linksState.data = [makeMobileLink({ legacyLevelId: 2 })];

    renderModal();

    expect(screen.getByText("Never published")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlink training level" })).toBeInTheDocument();
  });

  it("shows the last publish date on a training level that has published", () => {
    linksState.data = [
      makeMobileLink({
        legacyLevelId: 2,
        publishedDayCount: PUBLISHED_DAY_COUNT,
        lastPublishedAt: PUBLISHED_AT,
      }),
    ];

    renderModal();

    expect(
      screen.getByText(`Last published ${formatDate(PUBLISHED_AT, "day")}`),
    ).toBeInTheDocument();
    expect(screen.queryByText("Never published")).toBeNull();
  });

  it("stays on the lifetime status even when the link is pending for the open week", () => {
    linksState.data = [
      makeMobileLink({
        legacyLevelId: 2,
        publishedDayCount: PUBLISHED_DAY_COUNT,
        lastPublishedAt: PUBLISHED_AT,
        weekPublish: { publishedDayCount: 0, lastPublishedAt: null },
      }),
    ];

    renderModal();

    expect(
      screen.getByText(`Last published ${formatDate(PUBLISHED_AT, "day")}`),
    ).toBeInTheDocument();
    expect(screen.queryByText("This week not published yet")).toBeNull();
  });

  it("labels each linked level with its own status", () => {
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", legacyLevelId: 2 }),
      makeMobileLink({
        id: "cklink3000000000000000000a",
        legacyLevelId: 3,
        publishedDayCount: PUBLISHED_DAY_COUNT,
        lastPublishedAt: PUBLISHED_AT,
      }),
    ];

    renderModal();

    expect(screen.getByText("Never published")).toBeInTheDocument();
    expect(
      screen.getByText(`Last published ${formatDate(PUBLISHED_AT, "day")}`),
    ).toBeInTheDocument();
  });
});
