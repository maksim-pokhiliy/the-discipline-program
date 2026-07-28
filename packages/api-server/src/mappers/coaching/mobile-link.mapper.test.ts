import {
  MobilePublishChannel,
  type MobilePublishLink as PrismaMobilePublishLink,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { type MobileLinkPublishAggregate } from "@repo/contracts/coaching/mobile-link";

import { mapToMobileLink } from "./mobile-link.mapper";

const NOW = new Date("2025-06-01T12:00:00Z");
const LATER = new Date("2025-06-15T12:00:00Z");
const NEVER_PUBLISHED: MobileLinkPublishAggregate = { publishedDayCount: 0, lastPublishedAt: null };

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
    const result = mapToMobileLink(
      makeRow({
        channel: MobilePublishChannel.INDIVIDUAL,
        legacyLevelId: null,
        legacyUserId: 5,
        athleteId: "cls_athlete_1",
      }),
      NEVER_PUBLISHED,
    );

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
