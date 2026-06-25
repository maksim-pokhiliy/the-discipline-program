import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LegacyTrainingLevel } from "@repo/contracts/coaching/legacy-mobile";
import type { MobileConnection } from "@repo/contracts/coaching/mobile-connection";
import type { MobileLink } from "@repo/contracts/coaching/mobile-link";

import {
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

vi.mock("@app/lib/hooks", () => ({
  useMobileConnections: () => connectionsState,
  useTrainingLevels: () => levelsState,
  useMobileLinks: () => linksState,
}));

vi.mock("./manage-mobile-links-modal", () => ({
  ManageMobileLinksModal: () => null,
}));

vi.mock("./publish-week-modal", () => ({
  PublishWeekModal: () => null,
}));

const { MobilePublishingStrip } = await import("./mobile-publishing-strip");

const PLAN_ID = "ckplan1234567890abcdef0123";
const MONDAY = new Date("2026-01-05T00:00:00.000Z");

const renderStrip = () => render(<MobilePublishingStrip planId={PLAN_ID} monday={MONDAY} />);

beforeEach(() => {
  connectionsState.data = [makeMobileConnection()];
  connectionsState.isPending = false;
  levelsState.data = trainingLevelsFixture;
  levelsState.isPending = false;
  linksState.data = [];
  linksState.isPending = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MobilePublishingStrip (MT-14)", () => {
  it("shows 'Not linked' and disables Publish when there are no links", () => {
    linksState.data = [];

    renderStrip();

    expect(screen.getByText("Not linked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish this week" })).toBeDisabled();
  });

  it("lists the linked level names when names resolve", () => {
    linksState.data = [
      makeMobileLink({ id: "cklink2000000000000000000a", legacyLevelId: 2 }),
      makeMobileLink({ id: "cklink3000000000000000000a", legacyLevelId: 3 }),
    ];

    renderStrip();

    expect(screen.getByText("Publishes to: Pro, RX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish this week" })).toBeEnabled();
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
