import { describe, expect, it } from "vitest";

import { ConflictError, ValidationError } from "@repo/errors";

import { codeFieldErrorOf } from "./code-field-error";

const CODE_MESSAGE = "The locale code is reserved";
const issueError = (path: string): ValidationError =>
  new ValidationError("Validation failed", { issues: [{ path, message: CODE_MESSAGE }] });

describe("codeFieldErrorOf", () => {
  it("maps a duplicate by its field regardless of its details code or message", () => {
    expect(
      codeFieldErrorOf(new ConflictError("server wording", { field: "code", code: "uk" })),
    ).toBe("A language with this code already exists");
  });

  it("maps a validation issue for code", () => {
    expect(codeFieldErrorOf(issueError("code"))).toBe(CODE_MESSAGE);
  });

  it.each([
    issueError("name"),
    new ValidationError("Validation failed"),
    new ConflictError("A language with this code already exists"),
    new ConflictError("refused", { translatedSectionCount: 1, code: "ALREADY_EXISTS" }),
    new Error("plain failure"),
    null,
  ])("leaves an unmapped error to its caller: %s", (error) => {
    expect(codeFieldErrorOf(error)).toBeNull();
  });
});
