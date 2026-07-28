import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formatDate } from "@repo/shared";

import { render } from "@app/test/render";

import { MobileLinkPublishStatus } from "./mobile-link-publish-status";

const NEVER_PUBLISHED_LABEL = "Never published";
const CURRENT_YEAR = new Date().getFullYear();
const THIS_YEAR_PUBLISH = new Date(CURRENT_YEAR, 5, 11, 12);
const LAST_YEAR_PUBLISH = new Date(CURRENT_YEAR - 1, 5, 11, 12);
const PUBLISHED_DAY_COUNT = 6;

const statusText = (): string => screen.getByText(/^Last published/).textContent ?? "";

const chipClassNameFor = (label: string): string => {
  const chip = screen.getByText(label).closest(".MuiChip-root");

  return chip === null ? "" : chip.className;
};

describe("MobileLinkPublishStatus", () => {
  it("warns that the link has never published when its day count is zero", () => {
    render(<MobileLinkPublishStatus publishedDayCount={0} lastPublishedAt={null} />);

    expect(screen.getByText(NEVER_PUBLISHED_LABEL)).toBeInTheDocument();
    expect(chipClassNameFor(NEVER_PUBLISHED_LABEL)).toContain("MuiChip-colorWarning");
  });

  it("shows the last publish date instead of the warning once the link has published", () => {
    render(
      <MobileLinkPublishStatus
        publishedDayCount={PUBLISHED_DAY_COUNT}
        lastPublishedAt={THIS_YEAR_PUBLISH}
      />,
    );

    expect(screen.queryByText(NEVER_PUBLISHED_LABEL)).toBeNull();
    expect(
      screen.getByText(`Last published ${formatDate(THIS_YEAR_PUBLISH, "day")}`),
    ).toBeInTheDocument();
  });

  it("leaves the year off a publish that happened in the current year (DR-11)", () => {
    render(
      <MobileLinkPublishStatus
        publishedDayCount={PUBLISHED_DAY_COUNT}
        lastPublishedAt={THIS_YEAR_PUBLISH}
      />,
    );

    expect(statusText()).not.toContain(String(CURRENT_YEAR));
  });

  it("spells out the year for a publish from an earlier year (DR-11)", () => {
    render(
      <MobileLinkPublishStatus
        publishedDayCount={PUBLISHED_DAY_COUNT}
        lastPublishedAt={LAST_YEAR_PUBLISH}
      />,
    );

    expect(statusText()).toContain(String(CURRENT_YEAR - 1));
  });

  it("renders nothing when the link has published days but no known timestamp", () => {
    const { container } = render(
      <MobileLinkPublishStatus publishedDayCount={PUBLISHED_DAY_COUNT} lastPublishedAt={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
