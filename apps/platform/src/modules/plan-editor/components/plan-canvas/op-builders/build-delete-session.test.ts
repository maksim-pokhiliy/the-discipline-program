import { describe, expect, it } from "vitest";

import { buildDeleteSession } from "./build-delete-session";

const VALID_CUID_SESSION = "ckxw5p7gp0000q1mnzv5cuq0a";

describe("buildDeleteSession — emits delete-session op with version guard", () => {
  it("returns delete-session op with sessionId and expectedVersion", () => {
    const op = buildDeleteSession({ sessionId: VALID_CUID_SESSION, expectedVersion: 9 });

    expect(op).toEqual({
      kind: "delete-session",
      sessionId: VALID_CUID_SESSION,
      expectedVersion: 9,
    });
  });

  it("preserves expectedVersion of 1 for never-edited sessions", () => {
    const op = buildDeleteSession({ sessionId: VALID_CUID_SESSION, expectedVersion: 1 });

    expect(op).toEqual({
      kind: "delete-session",
      sessionId: VALID_CUID_SESSION,
      expectedVersion: 1,
    });
  });
});
