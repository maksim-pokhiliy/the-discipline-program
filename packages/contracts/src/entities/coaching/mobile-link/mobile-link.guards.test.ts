import { describe, expect, it } from "vitest";

import {
  isGeneralMobileLink,
  isIndividualMobileLink,
  partitionMobileLinks,
} from "./mobile-link.guards";
import { type GeneralMobileLink, type IndividualMobileLink } from "./mobile-link.types";

const LINK_ID = "clp9z8x7w0000abcd1234efgh";
const PLAN_ID = "clp9z8x7w0001abcd1234efgh";
const ATHLETE_ID = "clp9z8x7w0002abcd1234efgh";

const general: GeneralMobileLink = {
  id: LINK_ID,
  planId: PLAN_ID,
  channel: "GENERAL",
  legacyLevelId: 7,
  legacyUserId: null,
  athleteId: null,
  publishedDayCount: 0,
  lastPublishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const individual: IndividualMobileLink = {
  id: LINK_ID,
  planId: PLAN_ID,
  channel: "INDIVIDUAL",
  legacyLevelId: null,
  legacyUserId: 5,
  athleteId: ATHLETE_ID,
  publishedDayCount: 0,
  lastPublishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("isGeneralMobileLink", () => {
  it("returns true for a GENERAL link", () => {
    expect(isGeneralMobileLink(general)).toBe(true);
  });

  it("returns false for an INDIVIDUAL link", () => {
    expect(isGeneralMobileLink(individual)).toBe(false);
  });
});

describe("isIndividualMobileLink", () => {
  it("returns true for an INDIVIDUAL link", () => {
    expect(isIndividualMobileLink(individual)).toBe(true);
  });

  it("returns false for a GENERAL link", () => {
    expect(isIndividualMobileLink(general)).toBe(false);
  });
});

describe("partitionMobileLinks", () => {
  it("splits a mixed list into general and individual buckets, preserving order", () => {
    expect(partitionMobileLinks([general, individual, general])).toEqual({
      general: [general, general],
      individual: [individual],
    });
  });

  it("returns empty buckets for an empty list", () => {
    expect(partitionMobileLinks([])).toEqual({ general: [], individual: [] });
  });
});
