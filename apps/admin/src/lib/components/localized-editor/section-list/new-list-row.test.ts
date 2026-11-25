import { describe, expect, it } from "vitest";

import { makeListRow } from "./new-list-row";

const FIELDS = { question: { label: "Question" }, answer: { label: "Answer", minRows: 2 } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("makeListRow", () => {
  it("gives an added row a UUID", () => {
    expect(makeListRow(FIELDS).id).toMatch(UUID);
  });

  it("gives each added row a different id", () => {
    expect(makeListRow(FIELDS).id).not.toBe(makeListRow(FIELDS).id);
  });

  it("starts every descriptor field empty and includes nothing but those fields and the id", () => {
    expect(makeListRow(FIELDS)).toEqual({ id: expect.any(String), question: "", answer: "" });
  });
});
