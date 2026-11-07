import { describe, expect, it } from "vitest";

import { ENGLISH, makeLanguage, POLISH, UKRAINIAN } from "../languages.fixtures";

import { moveLanguage, toLanguageRows } from "./language-order";

const GERMAN = makeLanguage({ code: "de", name: "Deutsch", sortOrder: 3 });
const CATALOG = [ENGLISH, UKRAINIAN, POLISH, GERMAN];

describe("toLanguageRows", () => {
  it("uses the code as the table row id", () => {
    expect(toLanguageRows(CATALOG).map(({ id }) => id)).toEqual(CATALOG.map(({ code }) => code));
  });

  it("pins English and permits moves only among non-default neighbours", () => {
    expect(
      toLanguageRows(CATALOG).map(({ canMoveUp, canMoveDown }) => [canMoveUp, canMoveDown]),
    ).toEqual([
      [false, false],
      [false, true],
      [true, true],
      [true, false],
    ]);
  });

  it("gives a single non-default language no moves", () => {
    expect(toLanguageRows([ENGLISH, UKRAINIAN]).at(1)).toMatchObject({
      canMoveUp: false,
      canMoveDown: false,
    });
  });
});

describe("moveLanguage", () => {
  it("swaps up without including English or mutating the catalog", () => {
    expect(moveLanguage(CATALOG, POLISH.code, "up")).toEqual([
      POLISH.code,
      UKRAINIAN.code,
      GERMAN.code,
    ]);
    expect(CATALOG.map(({ code }) => code)).toEqual([
      ENGLISH.code,
      UKRAINIAN.code,
      POLISH.code,
      GERMAN.code,
    ]);
  });

  it("swaps down", () => {
    expect(moveLanguage(CATALOG, POLISH.code, "down")).toEqual([
      UKRAINIAN.code,
      GERMAN.code,
      POLISH.code,
    ]);
  });

  it.each([
    ["uk", "up"],
    ["de", "down"],
    ["en", "up"],
    ["xx", "down"],
  ] satisfies [string, "up" | "down"][])(
    "keeps an impossible %s move %s unchanged",
    (code, direction) => {
      expect(moveLanguage(CATALOG, code, direction)).toEqual([
        UKRAINIAN.code,
        POLISH.code,
        GERMAN.code,
      ]);
    },
  );
});
