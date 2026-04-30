import { describe, expect, it } from "vitest";

import {
  ALLOWED_EDIT_SESSION_ACTION_TYPES,
  createInitialState,
  editSessionReducer,
  type EditSessionAction,
} from "./use-edit-session.reducer";

type Draft = { name: string };

describe("editSessionReducer", () => {
  const initialDraft: Draft = { name: "alpha" };
  const initial = () => createInitialState<Draft>(initialDraft, 1);

  it("is pure for the same input", () => {
    const a = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });
    const b = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });

    expect(a).toEqual(b);
  });

  it("transitions idle -> dirty on dispatch-valid", () => {
    const next = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });

    expect(next.status).toBe("dirty");
    expect(next.isDirty).toBe(true);
    expect(next.isValid).toBe(true);
    expect(next.draft).toEqual({ name: "beta" });
  });

  it("transitions to dirty-invalid on dispatch-invalid", () => {
    const next = editSessionReducer(initial(), {
      type: "dispatch-invalid",
      draft: { name: "" },
    });

    expect(next.status).toBe("dirty-invalid");
    expect(next.isDirty).toBe(true);
    expect(next.isValid).toBe(false);
  });

  it("save-start only transitions when status is dirty", () => {
    const fromIdle = editSessionReducer(initial(), { type: "save-start" });

    expect(fromIdle.status).toBe("idle");

    const dirty = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });
    const saving = editSessionReducer(dirty, { type: "save-start" });

    expect(saving.status).toBe("saving");

    const invalid = editSessionReducer(initial(), {
      type: "dispatch-invalid",
      draft: { name: "" },
    });
    const stillInvalid = editSessionReducer(invalid, { type: "save-start" });

    expect(stillInvalid.status).toBe("dirty-invalid");
  });

  it("save-success bumps expectedVersion and clears dirty", () => {
    const dirty = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });
    const saved = editSessionReducer(dirty, {
      type: "save-success",
      next: { name: "beta" },
      nextVersion: 2,
      savedAt: new Date(0),
    });

    expect(saved.status).toBe("saved");
    expect(saved.isDirty).toBe(false);
    expect(saved.expectedVersion).toBe(2);
    expect(saved.lastSavedAt?.getTime()).toBe(0);
  });

  it("saved-fade returns to idle", () => {
    const dirty = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });
    const saved = editSessionReducer(dirty, {
      type: "save-success",
      next: { name: "beta" },
      nextVersion: 2,
      savedAt: new Date(),
    });
    const idle = editSessionReducer(saved, { type: "saved-fade" });

    expect(idle.status).toBe("idle");
  });

  it("save-conflict surfaces currentVersion", () => {
    const dirty = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });
    const conflict = editSessionReducer(dirty, {
      type: "save-conflict",
      currentVersion: 7,
    });

    expect(conflict.status).toBe("conflict");
    expect(conflict.conflict).toEqual({ currentVersion: 7 });
  });

  it("discard restores initial draft", () => {
    const dirty = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });
    const discarded = editSessionReducer(dirty, { type: "discard" });

    expect(discarded.status).toBe("idle");
    expect(discarded.draft).toEqual(initialDraft);
    expect(discarded.isDirty).toBe(false);
  });

  it("reset replaces initial + expectedVersion", () => {
    const next = editSessionReducer(initial(), {
      type: "reset",
      draft: { name: "gamma" },
      version: 5,
    });

    expect(next.draft).toEqual({ name: "gamma" });
    expect(next.expectedVersion).toBe(5);
    expect(next.status).toBe("idle");
  });

  it("dispatch-clean rolls back when draft is identical to initial reference", () => {
    const dirty = editSessionReducer(initial(), {
      type: "dispatch-valid",
      draft: { name: "beta" },
    });
    const cleaned = editSessionReducer(dirty, {
      type: "dispatch-clean",
      draft: dirty.initial,
    });

    expect(cleaned.status).toBe("idle");
    expect(cleaned.isDirty).toBe(false);
  });

  it("rejects non-whitelisted action types — only the listed actions are accepted", () => {
    const blurAction = "onBlur" as unknown as EditSessionAction<Draft>["type"];

    expect(ALLOWED_EDIT_SESSION_ACTION_TYPES).not.toContain(blurAction);
    expect(ALLOWED_EDIT_SESSION_ACTION_TYPES).toEqual(
      expect.arrayContaining([
        "dispatch-valid",
        "dispatch-invalid",
        "dispatch-clean",
        "save-start",
        "save-success",
        "save-failure",
        "save-conflict",
        "saved-fade",
        "discard",
        "reset",
      ]),
    );
    expect(ALLOWED_EDIT_SESSION_ACTION_TYPES).toHaveLength(10);
  });
});
