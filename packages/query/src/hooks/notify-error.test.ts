import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock },
}));

const { getIssues, notifyError } = await import("./notify-error");

describe("getIssues", () => {
  it("returns undefined when error is not an Error instance", () => {
    expect(getIssues("string")).toBeUndefined();
    expect(getIssues(null)).toBeUndefined();
    expect(getIssues({ details: { issues: [] } })).toBeUndefined();
  });

  it("returns undefined when error has no details object", () => {
    const error = new Error("plain");

    expect(getIssues(error)).toBeUndefined();
  });

  it("returns undefined when details.issues is not an array", () => {
    const error = Object.assign(new Error("x"), { details: { issues: "nope" } });

    expect(getIssues(error)).toBeUndefined();
  });

  it("normalises {path, message} objects from details.issues", () => {
    const error = Object.assign(new Error("validation failed"), {
      details: {
        issues: [
          { path: "name", message: "must be a string" },
          { path: "age", message: "must be >= 0" },
        ],
      },
    });

    expect(getIssues(error)).toEqual([
      { path: "name", message: "must be a string" },
      { path: "age", message: "must be >= 0" },
    ]);
  });

  it("collapses missing/non-string path values to an empty string", () => {
    const error = Object.assign(new Error("x"), {
      details: {
        issues: [
          { message: "no path" },
          { path: 42, message: "numeric path" },
          { path: "valid", message: "ok" },
        ],
      },
    });

    expect(getIssues(error)).toEqual([
      { path: "", message: "no path" },
      { path: "", message: "numeric path" },
      { path: "valid", message: "ok" },
    ]);
  });

  it("drops issues that lack a string message", () => {
    const error = Object.assign(new Error("x"), {
      details: {
        issues: [
          { path: "valid", message: "kept" },
          { path: "missing", message: undefined },
          null,
          { path: "no-message" },
        ],
      },
    });

    expect(getIssues(error)).toEqual([{ path: "valid", message: "kept" }]);
  });

  it("returns undefined when no issues survive normalisation", () => {
    const error = Object.assign(new Error("x"), {
      details: { issues: [{ path: "a" }, null] },
    });

    expect(getIssues(error)).toBeUndefined();
  });
});

describe("notifyError", () => {
  beforeEach(() => {
    toastErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("toasts each Zod validation issue separately when issues are present", () => {
    const error = Object.assign(new Error("validation failed"), {
      details: {
        issues: [
          { path: "name", message: "must be a string" },
          { path: "age", message: "must be >= 0" },
        ],
      },
    });

    notifyError(error, "Failed to save");

    expect(toastErrorMock).toHaveBeenCalledTimes(2);
    expect(toastErrorMock).toHaveBeenNthCalledWith(1, "name: must be a string");
    expect(toastErrorMock).toHaveBeenNthCalledWith(2, "age: must be >= 0");
  });

  it("toasts the bare message when an issue has no path", () => {
    const error = Object.assign(new Error("x"), {
      details: { issues: [{ message: "global problem" }] },
    });

    notifyError(error, "fallback");

    expect(toastErrorMock).toHaveBeenCalledExactlyOnceWith("global problem");
  });

  it("falls back to error.message when no issues are present", () => {
    notifyError(new Error("Plain failure"), "Failed to save");

    expect(toastErrorMock).toHaveBeenCalledExactlyOnceWith("Plain failure");
  });

  it("uses the supplied fallback when error.message is missing", () => {
    const error = new Error("");

    notifyError(error, "Failed to save");

    expect(toastErrorMock).toHaveBeenCalledExactlyOnceWith("Failed to save");
  });

  it("uses the supplied fallback when error is not an Error instance", () => {
    notifyError({ random: "shape" }, "Failed to save");

    expect(toastErrorMock).toHaveBeenCalledExactlyOnceWith("Failed to save");
  });
});
