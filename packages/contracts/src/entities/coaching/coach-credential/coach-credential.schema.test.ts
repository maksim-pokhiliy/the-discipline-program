import { describe, expect, it } from "vitest";

import { COACH_CREDENTIAL_CONSTANTS } from "./coach-credential.constants";
import {
  coachCredentialSchema,
  createCoachCredentialSchema,
  updateCoachCredentialSchema,
} from "./coach-credential.schema";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_CUID_2 = "clz00000000000000000fake2";
const NOW = new Date();

const buildCredential = () => ({
  id: VALID_CUID,
  coachProfileId: VALID_CUID_2,
  title: "Level 1 Trainer",
  issuer: "CrossFit",
  year: 2020,
  shownToAthletes: true,
  createdAt: NOW,
  updatedAt: NOW,
});

const buildCreate = () => ({
  title: "Level 1 Trainer",
  issuer: "CrossFit",
  year: 2020,
  shownToAthletes: true,
});

describe("coachCredentialSchema", () => {
  it("accepts a full valid credential", () => {
    expect(coachCredentialSchema.safeParse(buildCredential()).success).toBe(true);
  });

  it("rejects a non-integer year type", () => {
    expect(coachCredentialSchema.safeParse({ ...buildCredential(), year: "2020" }).success).toBe(
      false,
    );
  });

  it("rejects missing required fields", () => {
    expect(coachCredentialSchema.safeParse({ id: VALID_CUID, title: "L1" }).success).toBe(false);
  });
});

describe("createCoachCredentialSchema", () => {
  it("accepts a valid create payload", () => {
    expect(createCoachCredentialSchema.safeParse(buildCreate()).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(createCoachCredentialSchema.safeParse({ ...buildCreate(), title: "" }).success).toBe(
      false,
    );
  });

  it("rejects an empty issuer", () => {
    expect(createCoachCredentialSchema.safeParse({ ...buildCreate(), issuer: "" }).success).toBe(
      false,
    );
  });

  it("rejects a title over the max length", () => {
    const title = "a".repeat(COACH_CREDENTIAL_CONSTANTS.MAX_TITLE_LENGTH + 1);

    expect(createCoachCredentialSchema.safeParse({ ...buildCreate(), title }).success).toBe(false);
  });

  it("rejects an issuer over the max length", () => {
    const issuer = "a".repeat(COACH_CREDENTIAL_CONSTANTS.MAX_ISSUER_LENGTH + 1);

    expect(createCoachCredentialSchema.safeParse({ ...buildCreate(), issuer }).success).toBe(false);
  });

  it("rejects a year below the minimum", () => {
    const year = COACH_CREDENTIAL_CONSTANTS.MIN_YEAR - 1;

    expect(createCoachCredentialSchema.safeParse({ ...buildCreate(), year }).success).toBe(false);
  });

  it("rejects a floating-point year", () => {
    expect(createCoachCredentialSchema.safeParse({ ...buildCreate(), year: 2020.5 }).success).toBe(
      false,
    );
  });

  it("rejects a string year", () => {
    expect(createCoachCredentialSchema.safeParse({ ...buildCreate(), year: "2020" }).success).toBe(
      false,
    );
  });

  it("rejects a missing required field", () => {
    expect(createCoachCredentialSchema.safeParse({ title: "L1", issuer: "CrossFit" }).success).toBe(
      false,
    );
  });
});

describe("updateCoachCredentialSchema", () => {
  it("accepts an empty partial update", () => {
    expect(updateCoachCredentialSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a single-field partial update", () => {
    expect(updateCoachCredentialSchema.safeParse({ shownToAthletes: false }).success).toBe(true);
  });

  it("rejects an empty title in a partial update", () => {
    expect(updateCoachCredentialSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects a year below the minimum in a partial update", () => {
    expect(
      updateCoachCredentialSchema.safeParse({ year: COACH_CREDENTIAL_CONSTANTS.MIN_YEAR - 1 })
        .success,
    ).toBe(false);
  });
});
