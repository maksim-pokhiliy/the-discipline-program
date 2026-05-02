import { describe, expect, it } from "vitest";

import { buildUpdateSession } from "./build-update-session";

const VALID_CUID_SESSION = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildUpdateSession — emits update-session op with version guard", () => {
  it("returns update-session op with empty fullEntity when no patch fields are provided", () => {
    const op = buildUpdateSession({ sessionId: VALID_CUID_SESSION, expectedVersion: 8 });

    expect(op).toEqual({
      kind: "update-session",
      sessionId: VALID_CUID_SESSION,
      expectedVersion: 8,
      fullEntity: {},
    });
  });

  it("includes label and order changes", () => {
    const op = buildUpdateSession({
      sessionId: VALID_CUID_SESSION,
      expectedVersion: 2,
      order: 1,
      label: "Evening",
    });

    expect(op).toEqual({
      kind: "update-session",
      sessionId: VALID_CUID_SESSION,
      expectedVersion: 2,
      fullEntity: { order: 1, label: "Evening" },
    });
  });

  it("supports clearing label via null", () => {
    const op = buildUpdateSession({
      sessionId: VALID_CUID_SESSION,
      expectedVersion: 1,
      label: null,
      notes: null,
    });

    expect(op).toEqual({
      kind: "update-session",
      sessionId: VALID_CUID_SESSION,
      expectedVersion: 1,
      fullEntity: { label: null, notes: null },
    });
  });
});
