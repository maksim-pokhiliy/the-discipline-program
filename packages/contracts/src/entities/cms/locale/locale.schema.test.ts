import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE, LOCALE_CONSTANTS } from "./locale.constants";
import {
  createLocaleSchema,
  localeCodeSchema,
  localeSchema,
  publicLocaleSchema,
  updateLocaleSchema,
} from "./locale.schema";

const UKRAINIAN = { code: "uk", name: "Українська" };

const FIXED_DATE = new Date("2026-10-16T00:00:00.000Z");

const LOCALE_ROW = {
  ...UKRAINIAN,
  isEnabled: true,
  isDefault: false,
  sortOrder: 1,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

const ACCEPTED_CODES = ["en", "uk", "crh"];

const REFUSED_CODES = ["EN", "uk-UA", "u", "ukr1", "", "uk1", "uk/", " uk", "uk "];

const REFUSED_SORT_ORDERS = [-1, 1.5, LOCALE_CONSTANTS.MAX_SORT_ORDER + 1];

const ACCEPTED_SORT_ORDERS = [0, LOCALE_CONSTANTS.MAX_SORT_ORDER];

const SINGLE_FIELD_UPDATES: [string, Record<string, unknown>][] = [
  ["name", { name: "Ukrainian" }],
  ["isEnabled", { isEnabled: false }],
  ["sortOrder", { sortOrder: 3 }],
];

describe("localeCodeSchema", () => {
  it.each(ACCEPTED_CODES)("accepts %j", (code) => {
    expect(localeCodeSchema.safeParse(code).success).toBe(true);
  });

  it.each(REFUSED_CODES)("refuses %j", (code) => {
    expect(localeCodeSchema.safeParse(code).success).toBe(false);
  });
});

describe("createLocaleSchema", () => {
  it("accepts a code and a name", () => {
    expect(createLocaleSchema.parse(UKRAINIAN)).toEqual(UKRAINIAN);
  });

  it("trims the name", () => {
    expect(createLocaleSchema.parse({ ...UKRAINIAN, name: `  ${UKRAINIAN.name}  ` })).toEqual(
      UKRAINIAN,
    );
  });

  it("refuses an empty name", () => {
    expect(createLocaleSchema.safeParse({ ...UKRAINIAN, name: "" }).success).toBe(false);
  });

  it("refuses a name that trims to nothing", () => {
    expect(createLocaleSchema.safeParse({ ...UKRAINIAN, name: "   " }).success).toBe(false);
  });

  it("accepts a name of the maximum length", () => {
    const name = "a".repeat(LOCALE_CONSTANTS.MAX_NAME_LENGTH);

    expect(createLocaleSchema.safeParse({ ...UKRAINIAN, name }).success).toBe(true);
  });

  it("refuses a name longer than the maximum", () => {
    const name = "a".repeat(LOCALE_CONSTANTS.MAX_NAME_LENGTH + 1);

    expect(createLocaleSchema.safeParse({ ...UKRAINIAN, name }).success).toBe(false);
  });

  it("refuses a malformed code", () => {
    expect(createLocaleSchema.safeParse({ ...UKRAINIAN, code: "uk-UA" }).success).toBe(false);
  });

  it("refuses an unknown key", () => {
    expect(createLocaleSchema.safeParse({ ...UKRAINIAN, isEnabled: false }).success).toBe(false);
  });
});

describe("updateLocaleSchema", () => {
  it("accepts an empty update", () => {
    expect(updateLocaleSchema.parse({})).toEqual({});
  });

  it.each(SINGLE_FIELD_UPDATES)("accepts each field on its own: %s", (_field, update) => {
    expect(updateLocaleSchema.parse(update)).toEqual(update);
  });

  it("refuses an unknown key", () => {
    expect(updateLocaleSchema.safeParse({ code: "de" }).success).toBe(false);
  });

  it.each(REFUSED_SORT_ORDERS)("refuses a sort order of %s", (sortOrder) => {
    expect(updateLocaleSchema.safeParse({ sortOrder }).success).toBe(false);
  });

  it.each(ACCEPTED_SORT_ORDERS)("accepts a sort order of %s", (sortOrder) => {
    expect(updateLocaleSchema.safeParse({ sortOrder }).success).toBe(true);
  });
});

describe("localeSchema", () => {
  it("accepts a sort order above the input maximum", () => {
    const sortOrder = LOCALE_CONSTANTS.MAX_SORT_ORDER + 1;

    expect(localeSchema.safeParse({ ...LOCALE_ROW, sortOrder }).success).toBe(true);
  });
});

describe("publicLocaleSchema", () => {
  it("keeps only the code and the name", () => {
    expect(publicLocaleSchema.parse(LOCALE_ROW)).toEqual(UKRAINIAN);
  });
});

describe("DEFAULT_LOCALE_CODE", () => {
  it("is a valid locale code", () => {
    expect(localeCodeSchema.safeParse(DEFAULT_LOCALE_CODE).success).toBe(true);
  });
});
