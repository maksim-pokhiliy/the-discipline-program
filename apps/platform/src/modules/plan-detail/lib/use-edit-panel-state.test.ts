import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type OpenPanel, SAVED_FADE_MS, useEditPanelState } from "./use-edit-panel-state";

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

const errorOptions = (message: string, retry: () => void = () => undefined) => ({
  message,
  retry,
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
      result.current.setSaveStatus("error", errorOptions("Boom"));
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
      result.current.setSaveStatus("dirty");
    });
    expect(result.current.saveStatus).toBe("dirty");
  });

  it("setSaveStatus('error', { message, retry }) populates lastError; other transitions clear it", () => {
    const { result } = renderHook(() => useEditPanelState());
    const retry = vi.fn();

    act(() => {
      result.current.setSaveStatus("error", { message: "Save failed", retry });
    });

    expect(result.current.saveStatus).toBe("error");
    expect(result.current.lastError?.message).toBe("Save failed");
    expect(result.current.lastError?.retry).toBe(retry);

    act(() => {
      result.current.setSaveStatus("dirty");
    });

    expect(result.current.saveStatus).toBe("dirty");
    expect(result.current.lastError).toBeNull();
  });

  describe("retryLast", () => {
    it("invokes the stored retry callback when lastError is populated", () => {
      const { result } = renderHook(() => useEditPanelState());
      const retry = vi.fn();

      act(() => {
        result.current.setSaveStatus("error", { message: "Save failed", retry });
      });
      act(() => {
        result.current.retryLast();
      });

      expect(retry).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when lastError is null and does not crash", () => {
      const { result } = renderHook(() => useEditPanelState());

      expect(() => {
        act(() => {
          result.current.retryLast();
        });
      }).not.toThrow();
    });

    it("awaits a Promise-returning retry without throwing", () => {
      const { result } = renderHook(() => useEditPanelState());
      const retry = vi.fn(async () => Promise.resolve());

      act(() => {
        result.current.setSaveStatus("error", { message: "Save failed", retry });
      });
      act(() => {
        result.current.retryLast();
      });

      expect(retry).toHaveBeenCalledTimes(1);
    });
  });

  describe("saved → clean auto-fade timer", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("flips status to 'clean' after SAVED_FADE_MS when status was 'saved'", () => {
      const { result } = renderHook(() => useEditPanelState());

      act(() => {
        result.current.setSaveStatus("saved");
      });

      expect(result.current.saveStatus).toBe("saved");

      act(() => {
        vi.advanceTimersByTime(SAVED_FADE_MS);
      });

      expect(result.current.saveStatus).toBe("clean");
    });

    it("cancels the pending fade timer when status changes before it fires", () => {
      const { result } = renderHook(() => useEditPanelState());

      act(() => {
        result.current.setSaveStatus("saved");
      });
      act(() => {
        result.current.setSaveStatus("saving");
      });
      act(() => {
        vi.advanceTimersByTime(SAVED_FADE_MS);
      });

      expect(result.current.saveStatus).toBe("saving");
    });

    it("cancels the pending fade timer on unmount", () => {
      const { result, unmount } = renderHook(() => useEditPanelState());

      act(() => {
        result.current.setSaveStatus("saved");
      });

      unmount();

      expect(() => {
        vi.advanceTimersByTime(SAVED_FADE_MS);
      }).not.toThrow();
    });

    it("cancels the pending fade timer when openPanel is invoked", () => {
      const { result } = renderHook(() => useEditPanelState());

      act(() => {
        result.current.setSaveStatus("saved");
      });
      act(() => {
        result.current.openPanel(dayPanel());
      });
      act(() => {
        vi.advanceTimersByTime(SAVED_FADE_MS);
      });

      expect(result.current.saveStatus).toBe("clean");
    });
  });
});
