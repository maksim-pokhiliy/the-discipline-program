import { describe, expect, it } from "vitest";

import { extractTrailingConnector } from "../../prisma/seed/canonical-plan/trailing-connector";

describe("extractTrailingConnector (matrix §15 ConnectorForm)", () => {
  it("returns null connector and null cleaned notes when input notes is null", () => {
    expect(extractTrailingConnector(null)).toEqual({ connector: null, cleanedNotes: null });
  });

  it("passes free-text notes through unchanged when no connector hint is present", () => {
    const notes = "Just some coach instruction.\nKeep tempo controlled.";

    expect(extractTrailingConnector(notes)).toEqual({ connector: null, cleanedNotes: notes });
  });

  it("§15: parses the 'connector: then:' form (then) — synthetic Wk1 Fri carrier", () => {
    const result = extractTrailingConnector("connector: then:");

    expect(result.connector).toEqual({ form: "then" });
    expect(result.cleanedNotes).toBeNull();
  });

  it("§15: parses the 'connector: ...then...:' form (then_dots) — synthetic Wk2 Tue carrier", () => {
    const result = extractTrailingConnector("connector: ...then...:");

    expect(result.connector).toEqual({ form: "then_dots" });
    expect(result.cleanedNotes).toBeNull();
  });

  it("§15: parses the 'connector: ...then N rounds:' form (then_n_rounds), capturing roundsCount", () => {
    const result = extractTrailingConnector("connector: ...then 2 rounds:");

    expect(result.connector).toEqual({ form: "then_n_rounds", roundsCount: 2 });
    expect(result.cleanedNotes).toBeNull();
  });

  it("matches connector hints case-insensitively (accepts both 'then' and 'THEN' spellings)", () => {
    const result = extractTrailingConnector("connector: ...THEN 2 rounds:");

    expect(result.connector).toEqual({ form: "then_n_rounds", roundsCount: 2 });
  });

  it("strips every connector line when two hints share the same notes string", () => {
    const notes = "connector: then:\nconnector: ...then 3 rounds:";

    const result = extractTrailingConnector(notes);

    expect(result.connector).not.toBeNull();
    expect(result.cleanedNotes ?? "").not.toContain("connector:");
  });

  it("throws on out-of-range roundsCount at build time (0 is below the valid floor)", () => {
    expect(() => extractTrailingConnector("connector: ...then 99 rounds:")).not.toThrow();
    expect(() => extractTrailingConnector("connector: ...then 0 rounds:")).toThrow(/range/);
  });

  it("regex cap of 1-2 digits means 100+ never reaches the build step", () => {
    const result = extractTrailingConnector("connector: ...then 100 rounds:");

    expect(result.connector).toBeNull();
    expect(result.cleanedNotes).toContain("connector: ...then 100 rounds:");
  });

  it("requires the plural 'rounds' suffix — singular 'round' falls through to no match", () => {
    const result = extractTrailingConnector("connector: ...then 2 round:");

    expect(result.connector).toBeNull();
    expect(result.cleanedNotes).toBe("connector: ...then 2 round:");
  });

  it("preserves EXAMPLE annotation rows untouched (no 'connector:' prefix → no match)", () => {
    const notes = "[ EXAMPLE: ...then 5 rounds... ]";

    expect(extractTrailingConnector(notes)).toEqual({ connector: null, cleanedNotes: notes });
  });

  it("priority: then_n_rounds wins when multiple matchers would fire on different lines", () => {
    const notes = "connector: then:\nconnector: ...then 4 rounds:";

    const result = extractTrailingConnector(notes);

    expect(result.connector).toEqual({ form: "then_n_rounds", roundsCount: 4 });
  });

  it("priority: then_dots wins over plain then when both could match different lines", () => {
    const notes = "connector: then:\nconnector: ...then...:";

    const result = extractTrailingConnector(notes);

    expect(result.connector).toEqual({ form: "then_dots" });
  });

  it("strips connector lines but preserves surrounding free-text notes", () => {
    const notes = "Warm-up reminder.\nconnector: then:\nFollow with cooldown.";

    const result = extractTrailingConnector(notes);

    expect(result.connector).toEqual({ form: "then" });
    expect(result.cleanedNotes).toBe("Warm-up reminder.\n\nFollow with cooldown.");
  });

  it("returns null cleanedNotes when the input was only a connector line + whitespace", () => {
    const result = extractTrailingConnector("\n\nconnector: then:\n\n");

    expect(result.connector).toEqual({ form: "then" });
    expect(result.cleanedNotes).toBeNull();
  });

  it("rejects roundsCount of 0 (post-match bound check)", () => {
    expect(() => extractTrailingConnector("connector: ...then 00 rounds:")).toThrow(/range/);
  });

  it("accepts the colon-less variant 'connector: then' (regex has optional trailing colon)", () => {
    const result = extractTrailingConnector("connector: then");

    expect(result.connector).toEqual({ form: "then" });
  });
});
