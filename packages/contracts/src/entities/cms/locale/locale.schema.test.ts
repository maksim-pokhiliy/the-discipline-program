import { describe, expect, it } from "vitest";

import { localeCodeParamsSchema, localeQuerySchema } from "./locale-api.schema";
import { DEFAULT_LOCALE_CODE, LOCALE_CONSTANTS, RESERVED_LOCALE_CODES } from "./locale.constants";
import {
  createLocaleSchema,
  localeCodeSchema,
  publicLocaleSchema,
  reorderLocalesSchema,
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

const REFUSED_CODES = ["EN", "uk-UA", "u", "ukr1", "", "uk1", "uk/", " uk", "uk ", "üb", "ук"];

const SINGLE_FIELD_UPDATES: [string, Record<string, unknown>][] = [
  ["name", { name: "Ukrainian" }],
  ["isEnabled", { isEnabled: false }],
];

describe("localeCodeSchema", () => {
  it.each(ACCEPTED_CODES)("accepts %j", (code) => {
    expect(localeCodeSchema.safeParse(code).success).toBe(true);
  });

  it.each(REFUSED_CODES)("refuses %j with the code rule message", (code) => {
    const result = localeCodeSchema.safeParse(code);

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.every((issue) => issue.message === "Use two or three lowercase letters"),
    ).toBe(true);
  });
});

describe("RESERVED_LOCALE_CODES", () => {
  it("reserves the api route tree and the faq page", () => {
    expect(RESERVED_LOCALE_CODES).toStrictEqual(["api", "faq"]);
  });

  it.each(RESERVED_LOCALE_CODES)("refuses %s with a message that names it", (code) => {
    const result = localeCodeSchema.safeParse(code);

    expect(LOCALE_CONSTANTS.CODE_PATTERN.test(code)).toBe(true);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      expect.stringContaining(`"${code}"`),
    ]);
  });

  it.each(RESERVED_LOCALE_CODES)(
    "keeps %s out of a new locale, a locale param and a locale query",
    (code) => {
      expect(createLocaleSchema.safeParse({ ...UKRAINIAN, code }).success).toBe(false);
      expect(localeCodeParamsSchema.safeParse({ code }).success).toBe(false);
      expect(localeQuerySchema.safeParse({ locale: code }).success).toBe(false);
    },
  );
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

  it("refuses sortOrder as an unknown key", () => {
    expect(updateLocaleSchema.safeParse({ sortOrder: 1 }).success).toBe(false);
  });
});

describe("reorderLocalesSchema", () => {
  it.each([
    ["uk", "de"],
    ["de", "uk"],
  ])("accepts non-default codes in order %j", (...orderedCodes) => {
    expect(reorderLocalesSchema.parse({ orderedCodes })).toEqual({ orderedCodes });
  });

  it.each([
    ["empty", []],
    ["duplicate", ["uk", "uk"]],
    ["default", ["en", "uk"]],
    ["malformed", ["UK"]],
    ["reserved", ["faq"]],
  ])("refuses a %s list", (_name, orderedCodes) => {
    expect(reorderLocalesSchema.safeParse({ orderedCodes }).success).toBe(false);
  });

  it("refuses an unknown key", () => {
    expect(reorderLocalesSchema.safeParse({ orderedCodes: ["uk"], extra: true }).success).toBe(
      false,
    );
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
