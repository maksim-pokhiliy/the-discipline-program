import { describe, expect, it } from "vitest";

import type { MobileAthlete } from "@repo/contracts/coaching/legacy-mobile";

import { formatMobileAthleteName } from "./format-mobile-athlete-name";

const makeAthlete = (overrides: Partial<MobileAthlete>): MobileAthlete => ({
  id: 1,
  username: "athlete",
  firstName: null,
  lastName: null,
  ...overrides,
});

describe("formatMobileAthleteName", () => {
  it("joins firstName and lastName when both are present", () => {
    expect(formatMobileAthleteName(makeAthlete({ firstName: "First", lastName: "Last" }))).toBe(
      "First Last",
    );
  });

  it("returns firstName only when lastName is null", () => {
    expect(formatMobileAthleteName(makeAthlete({ firstName: "First", lastName: null }))).toBe(
      "First",
    );
  });

  it("returns lastName only when firstName is null", () => {
    expect(formatMobileAthleteName(makeAthlete({ firstName: null, lastName: "Last" }))).toBe(
      "Last",
    );
  });

  it("falls back to username when both names are null", () => {
    expect(
      formatMobileAthleteName(
        makeAthlete({ username: "fallback", firstName: null, lastName: null }),
      ),
    ).toBe("fallback");
  });
});
