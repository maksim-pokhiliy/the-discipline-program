import { describe, expect, it } from "vitest";

import { ConflictError, NotFoundError, ValidationError } from "@repo/errors";

import { UKRAINIAN } from "../languages.fixtures";

import { deleteRefusalOf } from "./delete-refusal";

const NAME = UKRAINIAN.name;
const MANY_SECTIONS = 3;

describe("deleteRefusalOf", () => {
  it.each([
    {
      isEnabled: true,
      count: 1,
      expected: `${NAME} still has content in 1 section, so it cannot be deleted. Disable it instead to hide it from the site.`,
    },
    {
      isEnabled: true,
      count: MANY_SECTIONS,
      expected: `${NAME} still has content in ${MANY_SECTIONS} sections, so it cannot be deleted. Disable it instead to hide it from the site.`,
    },
    {
      isEnabled: false,
      count: 1,
      expected: `${NAME} still has content in 1 section, so it cannot be deleted. It stays hidden from the site while it is disabled.`,
    },
    {
      isEnabled: false,
      count: MANY_SECTIONS,
      expected: `${NAME} still has content in ${MANY_SECTIONS} sections, so it cannot be deleted. It stays hidden from the site while it is disabled.`,
    },
  ])(
    "uses the row state $isEnabled and section count $count instead of the server message",
    ({ isEnabled, count, expected }) => {
      const error = new ConflictError("Never display this server message", {
        translatedSectionCount: count,
        code: "uk",
      });

      expect(deleteRefusalOf(error, { name: NAME, isEnabled })).toBe(expected);
    },
  );

  it.each([
    null,
    new Error("plain failure"),
    new NotFoundError(),
    new ValidationError("invalid", { translatedSectionCount: 1 }),
    new ConflictError("race", { code: "uk" }),
    new ConflictError("bad count", { translatedSectionCount: "1" }),
  ])("returns null for an unmapped error: %s", (error) => {
    expect(deleteRefusalOf(error, UKRAINIAN)).toBeNull();
  });
});
