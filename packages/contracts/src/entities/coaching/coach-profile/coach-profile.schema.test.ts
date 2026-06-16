import { describe, expect, it } from "vitest";

import { UserRole } from "../../iam/auth";

import { COACH_PROFILE_CONSTANTS, SPECIALTY_PRESET } from "./coach-profile.constants";
import {
  coachProfilePageDataSchema,
  coachProfileSchema,
  selfUpdateCoachProfileSchema,
  updateCoachProfileSchema,
} from "./coach-profile.schema";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_CUID_2 = "clz00000000000000000fake2";
const NOW = new Date();

const buildProfile = () => ({
  id: VALID_CUID,
  userId: VALID_CUID_2,
  bio: "Experienced coach",
  location: "Kyiv, UA",
  specialties: [SPECIALTY_PRESET[0], SPECIALTY_PRESET[1]],
  createdAt: NOW,
  updatedAt: NOW,
});

const buildPageData = () => ({
  user: {
    name: "Coach Denys",
    email: "coach@example.com",
    image: null,
    role: UserRole.COACH,
    timezone: "Europe/Kyiv",
    createdAt: NOW,
  },
  profile: {
    bio: "Experienced coach",
    location: "Kyiv, UA",
    specialties: [SPECIALTY_PRESET[3]],
  },
  credentials: [
    {
      id: VALID_CUID,
      coachProfileId: VALID_CUID_2,
      title: "Level 1 Trainer",
      issuer: "CrossFit",
      year: 2020,
      shownToAthletes: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ],
  trackRecord: {
    monthsActive: 12,
    athletesCoached: 4,
    plansAuthored: 7,
  },
});

describe("coachProfileSchema", () => {
  it("accepts a profile including location and specialties", () => {
    expect(coachProfileSchema.safeParse(buildProfile()).success).toBe(true);
  });

  it("accepts a profile with bio and location null", () => {
    expect(
      coachProfileSchema.safeParse({ ...buildProfile(), bio: null, location: null }).success,
    ).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(coachProfileSchema.safeParse({ id: VALID_CUID, userId: VALID_CUID_2 }).success).toBe(
      false,
    );
  });
});

describe("updateCoachProfileSchema", () => {
  it("accepts a valid specialties subset from the preset", () => {
    expect(updateCoachProfileSchema.safeParse({ specialties: [SPECIALTY_PRESET[0]] }).success).toBe(
      true,
    );
  });

  it("accepts clearing bio and location to null", () => {
    expect(updateCoachProfileSchema.safeParse({ bio: null, location: null }).success).toBe(true);
  });

  it("rejects a specialty outside the preset", () => {
    expect(
      updateCoachProfileSchema.safeParse({ specialties: ["Underwater basket weaving"] }).success,
    ).toBe(false);
  });

  it("rejects more than the maximum specialties", () => {
    const specialties = Array.from(
      { length: COACH_PROFILE_CONSTANTS.MAX_SPECIALTIES + 1 },
      (_unused, index) => SPECIALTY_PRESET[index % SPECIALTY_PRESET.length],
    );

    expect(updateCoachProfileSchema.safeParse({ specialties }).success).toBe(false);
  });

  it("rejects duplicate specialties (QA-005)", () => {
    expect(
      updateCoachProfileSchema.safeParse({
        specialties: [SPECIALTY_PRESET[0], SPECIALTY_PRESET[0]],
      }).success,
    ).toBe(false);
  });

  it("rejects a bio over the max length", () => {
    const bio = "a".repeat(COACH_PROFILE_CONSTANTS.MAX_BIO_LENGTH + 1);

    expect(updateCoachProfileSchema.safeParse({ bio }).success).toBe(false);
  });

  it("rejects a location over the max length", () => {
    const location = "a".repeat(COACH_PROFILE_CONSTANTS.MAX_LOCATION_LENGTH + 1);

    expect(updateCoachProfileSchema.safeParse({ location }).success).toBe(false);
  });
});

describe("selfUpdateCoachProfileSchema", () => {
  it("accepts an empty subset", () => {
    expect(selfUpdateCoachProfileSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a name-only subset", () => {
    expect(selfUpdateCoachProfileSchema.safeParse({ name: "Coach Denys" }).success).toBe(true);
  });

  it("accepts a full subset of editable fields", () => {
    expect(
      selfUpdateCoachProfileSchema.safeParse({
        name: "Coach Denys",
        image: null,
        timezone: "Europe/Kyiv",
        bio: "New bio",
        location: "Kyiv, UA",
        specialties: [SPECIALTY_PRESET[0]],
      }).success,
    ).toBe(true);
  });

  it("accepts clearing name to null", () => {
    expect(selfUpdateCoachProfileSchema.safeParse({ name: null }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(selfUpdateCoachProfileSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects a name over the max length (QA-004)", () => {
    const name = "a".repeat(COACH_PROFILE_CONSTANTS.MAX_NAME_LENGTH + 1);

    expect(selfUpdateCoachProfileSchema.safeParse({ name }).success).toBe(false);
  });

  it("rejects an invalid image url", () => {
    expect(selfUpdateCoachProfileSchema.safeParse({ image: "not-a-url" }).success).toBe(false);
  });

  it("rejects duplicate specialties (QA-005)", () => {
    expect(
      selfUpdateCoachProfileSchema.safeParse({
        specialties: [SPECIALTY_PRESET[0], SPECIALTY_PRESET[0]],
      }).success,
    ).toBe(false);
  });
});

describe("coachProfilePageDataSchema", () => {
  it("accepts a full page-data object", () => {
    expect(coachProfilePageDataSchema.safeParse(buildPageData()).success).toBe(true);
  });

  it("accepts a page-data object with no credentials", () => {
    expect(
      coachProfilePageDataSchema.safeParse({ ...buildPageData(), credentials: [] }).success,
    ).toBe(true);
  });

  it("rejects a negative track-record count", () => {
    const pageData = buildPageData();

    expect(
      coachProfilePageDataSchema.safeParse({
        ...pageData,
        trackRecord: { ...pageData.trackRecord, athletesCoached: -1 },
      }).success,
    ).toBe(false);
  });
});
