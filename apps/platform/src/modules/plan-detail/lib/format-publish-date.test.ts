import { describe, expect, it } from "vitest";

import { formatDate } from "@repo/shared";

import { formatPublishDate } from "./format-publish-date";

const CURRENT_YEAR = new Date().getFullYear();
const THIS_YEAR_PUBLISH = new Date(CURRENT_YEAR, 5, 11, 12);
const LAST_YEAR_PUBLISH = new Date(CURRENT_YEAR - 1, 5, 11, 12);

describe("formatPublishDate", () => {
  it("leaves the year off a date in the current year", () => {
    expect(formatPublishDate(THIS_YEAR_PUBLISH)).toBe(formatDate(THIS_YEAR_PUBLISH, "day"));
    expect(formatPublishDate(THIS_YEAR_PUBLISH)).not.toContain(String(CURRENT_YEAR));
  });

  it("spells out the year for a date from an earlier year", () => {
    expect(formatPublishDate(LAST_YEAR_PUBLISH)).toBe(formatDate(LAST_YEAR_PUBLISH, "short"));
    expect(formatPublishDate(LAST_YEAR_PUBLISH)).toContain(String(CURRENT_YEAR - 1));
  });
});

describe("formatPublishDate against the ISO strings the wire actually delivers", () => {
  const asWireDate = (value: Date): Date => value.toISOString() as unknown as Date;

  it("branches on the year of a wire-delivered instant instead of throwing on a string", () => {
    expect(formatPublishDate(asWireDate(THIS_YEAR_PUBLISH))).toBe(
      formatDate(THIS_YEAR_PUBLISH, "day"),
    );
  });

  it("still spells out the year for a wire-delivered instant from an earlier year", () => {
    expect(formatPublishDate(asWireDate(LAST_YEAR_PUBLISH))).toContain(String(CURRENT_YEAR - 1));
  });
});
