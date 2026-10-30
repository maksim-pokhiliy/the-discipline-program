import { describe, expect, it } from "vitest";

import { LOCALE_CONSTANTS, RESERVED_LOCALE_CODES } from "../locale";

import { PAGE_SLUG_PATH_MAP } from "./pages.constants";

const firstPathSegment = (path: string): string => path.split("/")[1] ?? "";

describe("RESERVED_LOCALE_CODES against the public path map", () => {
  it("reserves every first path segment that could pass for a locale code", () => {
    const codeShapedSegments = Object.values(PAGE_SLUG_PATH_MAP)
      .map(firstPathSegment)
      .filter((segment) => LOCALE_CONSTANTS.CODE_PATTERN.test(segment));

    expect(
      codeShapedSegments.filter((segment) => !RESERVED_LOCALE_CODES.includes(segment)),
    ).toStrictEqual([]);
  });
});
