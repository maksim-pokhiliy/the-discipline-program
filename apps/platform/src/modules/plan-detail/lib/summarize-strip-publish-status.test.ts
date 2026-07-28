import { describe, expect, it } from "vitest";

import type { MobileLink, MobileLinkPublishAggregate } from "@repo/contracts/coaching/mobile-link";

import { makeMobileLink } from "@app/lib/mobile.fixtures";

import { summarizeStripPublishStatus } from "./summarize-strip-publish-status";

const LINK_A = "cklinkaaaaaaaaaaaaaaaaaaaa";
const LINK_B = "cklinkbbbbbbbbbbbbbbbbbbbb";
const LINK_C = "cklinkcccccccccccccccccccc";
const EARLIER = new Date("2026-01-06T08:00:00.000Z");
const LATER = new Date("2026-01-08T17:30:00.000Z");
const LATEST = new Date("2026-01-09T06:15:00.000Z");
const LIFETIME_AT = new Date("2025-11-20T10:00:00.000Z");

const NEVER: MobileLinkPublishAggregate = { publishedDayCount: 0, lastPublishedAt: null };
const LIFETIME: MobileLinkPublishAggregate = { publishedDayCount: 8, lastPublishedAt: LIFETIME_AT };

const weekPublished = (lastPublishedAt: Date): MobileLinkPublishAggregate => ({
  publishedDayCount: 5,
  lastPublishedAt,
});

const makeLink = (
  id: string,
  lifetime: MobileLinkPublishAggregate,
  weekPublish?: MobileLinkPublishAggregate,
): MobileLink =>
  makeMobileLink({
    id,
    publishedDayCount: lifetime.publishedDayCount,
    lastPublishedAt: lifetime.lastPublishedAt,
    ...(weekPublish !== undefined && { weekPublish }),
  });

describe("summarizeStripPublishStatus", () => {
  it("returns the empty state when the plan has no links", () => {
    expect(summarizeStripPublishStatus([])).toEqual({ kind: "none" });
  });

  it("returns the empty state when every link has published and no week context was fetched", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, LIFETIME),
      makeLink(LINK_B, LIFETIME),
    ]);

    expect(status).toEqual({ kind: "none" });
  });
});

describe("summarizeStripPublishStatus never-published state", () => {
  it("labels the whole strip when no link has ever published", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, NEVER, NEVER),
      makeLink(LINK_B, NEVER, NEVER),
    ]);

    expect(status).toEqual({
      kind: "never-published",
      label: "Never published",
      weekPendingLabel: null,
      weekPublishedAt: null,
    });
  });

  it("carries the honest count when only some links have never published", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, NEVER, NEVER),
      makeLink(LINK_B, LIFETIME, weekPublished(EARLIER)),
      makeLink(LINK_C, LIFETIME, weekPublished(LATER)),
    ]);

    expect(status).toEqual({
      kind: "never-published",
      label: "1 never published",
      weekPendingLabel: null,
      weekPublishedAt: LATER,
    });
  });

  it("keeps this week's publish confirmation alongside the never-published warning", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, NEVER, NEVER),
      makeLink(LINK_B, LIFETIME, weekPublished(LATER)),
    ]);

    expect(status.kind).toBe("never-published");
    expect(status.kind === "never-published" ? status.weekPublishedAt : null).toEqual(LATER);
  });

  it("wins over a week-pending link but still reports how many are missing this week (F4)", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, NEVER, NEVER),
      makeLink(LINK_B, LIFETIME, NEVER),
    ]);

    expect(status).toEqual({
      kind: "never-published",
      label: "1 never published",
      weekPendingLabel: "1 not published this week",
      weekPublishedAt: null,
    });
  });

  it("does not let one brand-new link hide four established links missing this week (F4)", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, NEVER, NEVER),
      makeLink(LINK_B, LIFETIME, NEVER),
      makeLink(LINK_C, LIFETIME, NEVER),
      makeLink("cklinkdddddddddddddddddddd", LIFETIME, NEVER),
      makeLink("cklinkeeeeeeeeeeeeeeeeeeee", LIFETIME, NEVER),
    ]);

    expect(status).toEqual({
      kind: "never-published",
      label: "1 never published",
      weekPendingLabel: "4 not published this week",
      weekPublishedAt: null,
    });
  });

  it("leaves the week-pending label off when every other link already went out this week", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, NEVER, NEVER),
      makeLink(LINK_B, LIFETIME, weekPublished(LATER)),
    ]);

    expect(status.kind === "never-published" ? status.weekPendingLabel : "unset").toBeNull();
  });
});

describe("summarizeStripPublishStatus week-pending state", () => {
  it("labels the whole strip when every published link is missing this week", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, LIFETIME, NEVER),
      makeLink(LINK_B, LIFETIME, NEVER),
    ]);

    expect(status).toEqual({
      kind: "week-pending",
      label: "This week not published yet",
      weekPublishedAt: null,
    });
  });

  it("carries the honest count when only some links are missing this week", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, LIFETIME, NEVER),
      makeLink(LINK_B, LIFETIME, weekPublished(EARLIER)),
      makeLink(LINK_C, LIFETIME, weekPublished(LATER)),
    ]);

    expect(status).toEqual({
      kind: "week-pending",
      label: "1 not published this week",
      weekPublishedAt: LATER,
    });
  });

  it("keeps this week's publish confirmation alongside the pending warning", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, LIFETIME, NEVER),
      makeLink(LINK_B, LIFETIME, weekPublished(EARLIER)),
    ]);

    expect(status.kind).toBe("week-pending");
    expect(status.kind === "week-pending" ? status.weekPublishedAt : null).toEqual(EARLIER);
  });
});

describe("summarizeStripPublishStatus week-published state", () => {
  it("reports the week as published when every link went out this week", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, LIFETIME, weekPublished(EARLIER)),
      makeLink(LINK_B, LIFETIME, weekPublished(LATER)),
    ]);

    expect(status).toEqual({ kind: "week-published", weekPublishedAt: LATER });
  });

  it("picks the newest publish across links regardless of their order", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, LIFETIME, weekPublished(LATEST)),
      makeLink(LINK_B, LIFETIME, weekPublished(EARLIER)),
      makeLink(LINK_C, LIFETIME, weekPublished(LATER)),
    ]);

    expect(status).toEqual({ kind: "week-published", weekPublishedAt: LATEST });
  });
});

describe("summarizeStripPublishStatus against the ISO strings the wire actually delivers", () => {
  const asWireDate = (value: Date): Date => value.toISOString() as unknown as Date;

  it("compares wire dates by value, not by a Date method the runtime payload does not have", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, LIFETIME, weekPublished(asWireDate(EARLIER))),
      makeLink(LINK_B, LIFETIME, weekPublished(asWireDate(LATEST))),
      makeLink(LINK_C, LIFETIME, weekPublished(asWireDate(LATER))),
    ]);

    expect(status).toEqual({ kind: "week-published", weekPublishedAt: LATEST.toISOString() });
  });

  it("still reads a wire-delivered lifetime aggregate as published", () => {
    const status = summarizeStripPublishStatus([
      makeLink(LINK_A, { publishedDayCount: 8, lastPublishedAt: asWireDate(LIFETIME_AT) }, NEVER),
    ]);

    expect(status).toEqual({
      kind: "week-pending",
      label: "This week not published yet",
      weekPublishedAt: null,
    });
  });
});
