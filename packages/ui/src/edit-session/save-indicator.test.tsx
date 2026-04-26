import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../test/render";

import { SaveIndicator } from "./save-indicator";

describe("SaveIndicator", () => {
  it("renders all seven status states without crashing", () => {
    const statuses = [
      "idle",
      "dirty",
      "dirty-invalid",
      "saving",
      "saved",
      "error",
      "conflict",
    ] as const;

    for (const status of statuses) {
      const { unmount } = render(<SaveIndicator status={status} />);

      unmount();
    }
  });

  it("shows 'No edits yet' when idle and no lastSavedAt is provided", () => {
    render(<SaveIndicator status="idle" />);
    expect(screen.getByText("No edits yet")).toBeInTheDocument();
  });

  it("shows 'Unsaved changes — saving in 8s' when dirty", () => {
    render(<SaveIndicator status="dirty" />);
    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();
  });

  it("shows 'Cannot save — fix errors' when dirty-invalid", () => {
    render(<SaveIndicator status="dirty-invalid" />);
    expect(screen.getByText(/Cannot save/i)).toBeInTheDocument();
  });

  it("shows 'Saving…' when saving", () => {
    render(<SaveIndicator status="saving" />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("shows 'Saved just now' when saved", () => {
    render(<SaveIndicator status="saved" />);
    expect(screen.getByText("Saved just now")).toBeInTheDocument();
  });

  it("shows error label and a retry button when status is error and onRetry is provided", () => {
    render(<SaveIndicator status="error" errorMessage="Boom" onRetry={() => undefined} />);
    expect(screen.getByText("Boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("shows conflict copy and Reload button when status is conflict and onReload is provided", () => {
    render(
      <SaveIndicator
        status="conflict"
        conflict={{ currentVersion: 12 }}
        onReload={() => undefined}
      />,
    );
    expect(screen.getByText(/Edited in another window/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload from server/i })).toBeInTheDocument();
  });
});
