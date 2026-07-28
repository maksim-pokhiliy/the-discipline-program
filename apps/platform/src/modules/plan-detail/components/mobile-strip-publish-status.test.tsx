import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formatDate } from "@repo/shared";

import { render } from "@app/test/render";

import { type StripPublishStatus } from "../lib/summarize-strip-publish-status";

import { MobileStripPublishStatus } from "./mobile-strip-publish-status";

const CURRENT_YEAR = new Date().getFullYear();
const WEEK_PUBLISHED_AT = new Date(CURRENT_YEAR, 0, 5, 12);
const LAST_YEAR_PUBLISHED_AT = new Date(CURRENT_YEAR - 1, 4, 3, 12);
const WEEK_SENT_CAPTION = `This week: sent ${formatDate(WEEK_PUBLISHED_AT, "day")}`;
const CHECKING_LABEL = "Checking this week…";
const NEVER_PUBLISHED_LABEL = "Never published";
const NEVER_PUBLISHED_SOME_LABEL = "2 never published";
const WEEK_PENDING_LABEL = "This week not published yet";
const WEEK_PENDING_SOME_LABEL = "2 not published this week";

const renderStatus = (status: StripPublishStatus) =>
  render(<MobileStripPublishStatus status={status} />);

const chipClassNameFor = (label: string): string => {
  const chip = screen.getByText(label).closest(".MuiChip-root");

  return chip === null ? "" : chip.className;
};

describe("MobileStripPublishStatus", () => {
  it("renders nothing when there is no status to show", () => {
    const { container } = renderStatus({ kind: "none" });

    expect(container).toBeEmptyDOMElement();
  });

  it("says the week is still being checked rather than looking like an all-clear (F8)", () => {
    const { container } = renderStatus({ kind: "checking" });

    expect(screen.getByText(CHECKING_LABEL)).toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();
    expect(container.querySelector(".MuiChip-root")).toBeNull();
  });

  it("renders the never-published warning chip on its own when nothing went out this week", () => {
    const { container } = renderStatus({
      kind: "never-published",
      label: NEVER_PUBLISHED_LABEL,
      weekPendingLabel: null,
      weekPublishedAt: null,
    });

    expect(screen.getByText(NEVER_PUBLISHED_LABEL)).toBeInTheDocument();
    expect(chipClassNameFor(NEVER_PUBLISHED_LABEL)).toContain("MuiChip-colorWarning");
    expect(container.textContent).not.toContain("This week: sent");
    expect(container.querySelectorAll(".MuiChip-root")).toHaveLength(1);
  });

  it("keeps this week's confirmation next to the never-published chip", () => {
    renderStatus({
      kind: "never-published",
      label: NEVER_PUBLISHED_SOME_LABEL,
      weekPendingLabel: null,
      weekPublishedAt: WEEK_PUBLISHED_AT,
    });

    expect(screen.getByText(NEVER_PUBLISHED_SOME_LABEL)).toBeInTheDocument();
    expect(screen.getByText(WEEK_SENT_CAPTION)).toBeInTheDocument();
  });

  it("adds an info chip for the links that are merely missing this week (F4)", () => {
    renderStatus({
      kind: "never-published",
      label: NEVER_PUBLISHED_LABEL,
      weekPendingLabel: WEEK_PENDING_SOME_LABEL,
      weekPublishedAt: null,
    });

    expect(chipClassNameFor(NEVER_PUBLISHED_LABEL)).toContain("MuiChip-colorWarning");
    expect(chipClassNameFor(WEEK_PENDING_SOME_LABEL)).toContain("MuiChip-colorInfo");
  });

  it("renders the week-pending state as an info chip, not a warning", () => {
    renderStatus({ kind: "week-pending", label: WEEK_PENDING_LABEL, weekPublishedAt: null });

    expect(screen.getByText(WEEK_PENDING_LABEL)).toBeInTheDocument();
    expect(chipClassNameFor(WEEK_PENDING_LABEL)).toContain("MuiChip-colorInfo");
  });

  it("keeps this week's confirmation next to the week-pending chip", () => {
    renderStatus({
      kind: "week-pending",
      label: WEEK_PENDING_SOME_LABEL,
      weekPublishedAt: WEEK_PUBLISHED_AT,
    });

    expect(screen.getByText(WEEK_PENDING_SOME_LABEL)).toBeInTheDocument();
    expect(screen.getByText(WEEK_SENT_CAPTION)).toBeInTheDocument();
  });

  it("drops the chip once something went out for the week, claiming only when it was last sent (F5)", () => {
    const { container } = renderStatus({
      kind: "week-published",
      weekPublishedAt: WEEK_PUBLISHED_AT,
    });

    expect(screen.getByText(WEEK_SENT_CAPTION)).toBeInTheDocument();
    expect(container.textContent).not.toContain("This week published");
    expect(container.querySelector(".MuiChip-root")).toBeNull();
  });

  it("dates the send rather than naming a day inside the displayed week (F10)", () => {
    const { container } = renderStatus({
      kind: "week-published",
      weekPublishedAt: WEEK_PUBLISHED_AT,
    });

    expect(container.textContent).toBe(WEEK_SENT_CAPTION);
    expect(container.textContent).not.toContain("Last sent this week");
  });

  it("spells out the year on a week caption from an earlier year, like its sibling widget (F6)", () => {
    const { container } = renderStatus({
      kind: "week-published",
      weekPublishedAt: LAST_YEAR_PUBLISHED_AT,
    });

    expect(container.textContent).toContain(String(new Date().getFullYear() - 1));
  });
});
