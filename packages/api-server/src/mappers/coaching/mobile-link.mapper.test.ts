import {
  MobilePublishChannel,
  type MobilePublishLink as PrismaMobilePublishLink,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type MobileLinkPublishAggregate } from "@repo/contracts/coaching/mobile-link";

import { mapToMobileLink } from "./mobile-link.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");
const PUBLISHED_AT = new Date("2025-06-10T08:00:00Z");
const WEEK_PUBLISHED_AT = new Date("2025-06-14T19:00:00Z");
const PUBLISHED_DAY_COUNT = 9;
const WEEK_DAY_COUNT = 3;
const NEVER_PUBLISHED: MobileLinkPublishAggregate = { publishedDayCount: 0, lastPublishedAt: null };
const PUBLISHED: MobileLinkPublishAggregate = {
  publishedDayCount: PUBLISHED_DAY_COUNT,
  lastPublishedAt: PUBLISHED_AT,
};
const WEEK_PUBLISHED: MobileLinkPublishAggregate = {
  publishedDayCount: WEEK_DAY_COUNT,
  lastPublishedAt: WEEK_PUBLISHED_AT,
};

const makeRow = (overrides: Partial<PrismaMobilePublishLink> = {}): PrismaMobilePublishLink => ({
  id: "cls_ml_1",
  connectionId: "cls_mc_1",
  planId: "cls_plan_1",
  channel: MobilePublishChannel.GENERAL,
  legacyLevelId: 2,
  legacyUserId: null,
  athleteId: null,
  createdAt: NOW,
  updatedAt: LATER,
  ...overrides,
});

const makeIndividualRow = (
  overrides: Partial<PrismaMobilePublishLink> = {},
): PrismaMobilePublishLink =>
  makeRow({
    channel: MobilePublishChannel.INDIVIDUAL,
    legacyLevelId: null,
    legacyUserId: 5,
    athleteId: "cls_athlete_1",
    ...overrides,
  });

describe("mapToMobileLink", () => {
  it("maps the persisted link to the DTO shape", () => {
    const result = mapToMobileLink(makeRow(), NEVER_PUBLISHED);

    expect(result).toEqual({
      id: "cls_ml_1",
      planId: "cls_plan_1",
      channel: "GENERAL",
      legacyLevelId: 2,
      legacyUserId: null,
      athleteId: null,
      publishedDayCount: 0,
      lastPublishedAt: null,
      createdAt: NOW,
      updatedAt: LATER,
    });
  });

  it("does not expose the internal connectionId", () => {
    const result = mapToMobileLink(makeRow(), NEVER_PUBLISHED);

    expect(result).not.toHaveProperty("connectionId");
  });

  it("preserves the legacy level id verbatim", () => {
    const result = mapToMobileLink(makeRow({ legacyLevelId: 7 }), NEVER_PUBLISHED);

    expect(result.legacyLevelId).toBe(7);
  });

  it("maps an individual link carrying its full identity bridge", () => {
    const result = mapToMobileLink(makeIndividualRow(), NEVER_PUBLISHED);

    expect(result).toEqual({
      id: "cls_ml_1",
      planId: "cls_plan_1",
      channel: "INDIVIDUAL",
      legacyLevelId: null,
      legacyUserId: 5,
      athleteId: "cls_athlete_1",
      publishedDayCount: 0,
      lastPublishedAt: null,
      createdAt: NOW,
      updatedAt: LATER,
    });
  });

  it("throws when an individual row is missing its identity keys (fail closed)", () => {
    expect(() =>
      mapToMobileLink(
        makeRow({ channel: MobilePublishChannel.INDIVIDUAL, legacyLevelId: null }),
        NEVER_PUBLISHED,
      ),
    ).toThrow("missing its identity keys");
  });
});

describe("mapToMobileLink publish aggregate", () => {
  it("carries a non-zero lifetime aggregate onto a general link", () => {
    const result = mapToMobileLink(makeRow(), PUBLISHED);

    expect(result.publishedDayCount).toBe(PUBLISHED_DAY_COUNT);
    expect(result.lastPublishedAt).toEqual(PUBLISHED_AT);
  });

  it("carries a non-zero lifetime aggregate onto an individual link", () => {
    const result = mapToMobileLink(makeIndividualRow(), PUBLISHED);

    expect(result.channel).toBe("INDIVIDUAL");
    expect(result.publishedDayCount).toBe(PUBLISHED_DAY_COUNT);
    expect(result.lastPublishedAt).toEqual(PUBLISHED_AT);
  });

  it("emits the week aggregate alongside the lifetime one on a general link", () => {
    const result = mapToMobileLink(makeRow(), PUBLISHED, WEEK_PUBLISHED);

    expect(result.weekPublish).toEqual(WEEK_PUBLISHED);
    expect(result.publishedDayCount).toBe(PUBLISHED_DAY_COUNT);
  });

  it("emits the week aggregate alongside the lifetime one on an individual link", () => {
    const result = mapToMobileLink(makeIndividualRow(), PUBLISHED, WEEK_PUBLISHED);

    expect(result.weekPublish).toEqual(WEEK_PUBLISHED);
    expect(result.channel).toBe("INDIVIDUAL");
  });

  it("emits a zero week aggregate verbatim rather than dropping it", () => {
    const result = mapToMobileLink(makeRow(), PUBLISHED, NEVER_PUBLISHED);

    expect(result.weekPublish).toEqual(NEVER_PUBLISHED);
  });

  it("omits the weekPublish key entirely when no week aggregate is supplied", () => {
    expect(Object.keys(mapToMobileLink(makeRow(), PUBLISHED))).not.toContain("weekPublish");
    expect(Object.keys(mapToMobileLink(makeIndividualRow(), PUBLISHED))).not.toContain(
      "weekPublish",
    );
  });
});
