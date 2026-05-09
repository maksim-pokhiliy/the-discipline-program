import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type OpenPanel, useEditPanelState } from "./use-edit-panel-state";

const SOME_DATE = new Date("2026-05-12T00:00:00.000Z");
const ANOTHER_DATE = new Date("2026-05-13T00:00:00.000Z");

const dayPanel = (date: Date = SOME_DATE): OpenPanel => ({
  kind: "day",
  dayId: null,
  date,
});

const sessionPanel = (): OpenPanel => ({
  kind: "session",
  dayId: "ckxdayid0000000000000000000",
  sessionId: null,
});

describe("useEditPanelState", () => {
  it("starts with the documented initial shape", () => {
    const { result } = renderHook(() => useEditPanelState());

    expect(result.current.open).toBeNull();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.saveStatus).toBe("clean");
    expect(result.current.pendingClose).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it("openPanel sets the open panel when no draft is in flight", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.openPanel(dayPanel());
    });

    expect(result.current.open?.kind).toBe("day");
    expect(result.current.pendingClose).toBe(false);
  });

  it("markDirty(true) flips isDirty to true", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.openPanel(dayPanel());
    });
    act(() => {
      result.current.markDirty(true);
    });

    expect(result.current.isDirty).toBe(true);
  });

  it("requestClose sets pendingClose when dirty and closes immediately when clean", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.openPanel(dayPanel());
    });
    act(() => {
      result.current.markDirty(true);
    });
    act(() => {
      result.current.requestClose();
    });

    expect(result.current.pendingClose).toBe(true);
    expect(result.current.open?.kind).toBe("day");

    act(() => {
      result.current.markDirty(false);
    });
    act(() => {
      result.current.requestClose();
    });

    expect(result.current.open).toBeNull();
    expect(result.current.saveStatus).toBe("clean");
  });

  it("confirmDiscard clears state when no pending panel was stashed", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.openPanel(dayPanel());
    });
    act(() => {
      result.current.markDirty(true);
    });
    act(() => {
      result.current.requestClose();
    });
    act(() => {
      result.current.confirmDiscard();
    });

    expect(result.current.open).toBeNull();
    expect(result.current.isDirty).toBe(false);
    expect(result.current.saveStatus).toBe("clean");
    expect(result.current.pendingClose).toBe(false);
  });

  it("cancelDiscard clears pendingClose but keeps the open panel", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.openPanel(dayPanel());
    });
    act(() => {
      result.current.markDirty(true);
    });
    act(() => {
      result.current.requestClose();
    });
    act(() => {
      result.current.cancelDiscard();
    });

    expect(result.current.pendingClose).toBe(false);
    expect(result.current.open?.kind).toBe("day");
    expect(result.current.isDirty).toBe(true);
  });

  it("opening a different panel while dirty stashes the request and triggers pendingClose", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.openPanel(dayPanel());
    });
    act(() => {
      result.current.markDirty(true);
    });
    act(() => {
      result.current.openPanel(sessionPanel());
    });

    expect(result.current.pendingClose).toBe(true);
    expect(result.current.open?.kind).toBe("day");

    act(() => {
      result.current.confirmDiscard();
    });

    expect(result.current.open?.kind).toBe("session");
    expect(result.current.isDirty).toBe(false);
    expect(result.current.pendingClose).toBe(false);
  });

  it("openPanel resets save status and last error when no draft is in flight", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.openPanel(dayPanel());
    });
    act(() => {
      result.current.setSaveStatus("error", new Error("Boom"));
    });
    act(() => {
      result.current.openPanel(dayPanel(ANOTHER_DATE));
    });

    expect(result.current.saveStatus).toBe("clean");
    expect(result.current.lastError).toBeNull();
  });

  it("setSaveStatus updates the indicator status", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.setSaveStatus("saving");
    });
    expect(result.current.saveStatus).toBe("saving");

    act(() => {
      result.current.setSaveStatus("saved");
    });
    expect(result.current.saveStatus).toBe("saved");
  });

  it("setSaveStatus('error', error) populates lastError; other transitions clear it", () => {
    const { result } = renderHook(() => useEditPanelState());

    act(() => {
      result.current.setSaveStatus("error", new Error("Save failed"));
    });

    expect(result.current.saveStatus).toBe("error");
    expect(result.current.lastError).toEqual({ message: "Save failed" });

    act(() => {
      result.current.setSaveStatus("saved");
    });

    expect(result.current.saveStatus).toBe("saved");
    expect(result.current.lastError).toBeNull();
  });

  it("retryLast is a documented no-op and does not crash", () => {
    const { result } = renderHook(() => useEditPanelState());

    expect(() => {
      act(() => {
        result.current.retryLast();
      });
    }).not.toThrow();
  });
});
