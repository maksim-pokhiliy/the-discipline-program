import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { type StripPublishStatus } from "../lib/summarize-strip-publish-status";

import { MobileStripPublishStatus } from "./mobile-strip-publish-status";

const WEEK_PUBLISHED_AT = new Date(2026, 0, 5, 12);
const WEEK_PUBLISHED_CAPTION = "This week published Jan 5";
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

  it("renders the never-published warning chip on its own when nothing went out this week", () => {
    const { container } = renderStatus({
      kind: "never-published",
      label: NEVER_PUBLISHED_LABEL,
      weekPublishedAt: null,
    });

    expect(screen.getByText(NEVER_PUBLISHED_LABEL)).toBeInTheDocument();
    expect(chipClassNameFor(NEVER_PUBLISHED_LABEL)).toContain("MuiChip-colorWarning");
    expect(container.textContent).not.toContain("This week published");
  });

  it("keeps this week's confirmation next to the never-published chip", () => {
    renderStatus({
      kind: "never-published",
      label: NEVER_PUBLISHED_SOME_LABEL,
      weekPublishedAt: WEEK_PUBLISHED_AT,
    });

    expect(screen.getByText(NEVER_PUBLISHED_SOME_LABEL)).toBeInTheDocument();
    expect(screen.getByText(WEEK_PUBLISHED_CAPTION)).toBeInTheDocument();
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
    expect(screen.getByText(WEEK_PUBLISHED_CAPTION)).toBeInTheDocument();
  });

  it("drops the chip entirely once the whole week has published", () => {
    const { container } = renderStatus({
      kind: "week-published",
      weekPublishedAt: WEEK_PUBLISHED_AT,
    });

    expect(screen.getByText(WEEK_PUBLISHED_CAPTION)).toBeInTheDocument();
    expect(container.querySelector(".MuiChip-root")).toBeNull();
  });
});
