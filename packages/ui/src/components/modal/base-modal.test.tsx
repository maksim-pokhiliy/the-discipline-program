import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { BaseModal } from "./base-modal";

describe("BaseModal", () => {
  it("renders the title", () => {
    render(
      <BaseModal open={true} onClose={vi.fn()} title="Edit block">
        <span data-testid="modal-body">body</span>
      </BaseModal>,
    );

    expect(screen.getByText("Edit block")).toBeInTheDocument();
  });

  it("renders the subtitle under the title when provided", () => {
    render(
      <BaseModal
        open={true}
        onClose={vi.fn()}
        title="Edit block"
        subtitle="intensity + cap cascade to all schemas in this block"
      >
        <span>body</span>
      </BaseModal>,
    );

    expect(screen.getByText("Edit block")).toBeInTheDocument();
    expect(
      screen.getByText("intensity + cap cascade to all schemas in this block"),
    ).toBeInTheDocument();
  });

  it("omits the subtitle when not provided", () => {
    const { rerender } = render(
      <BaseModal open={true} onClose={vi.fn()} title="Edit block" subtitle="cascade note">
        <span>body</span>
      </BaseModal>,
    );

    expect(screen.getByText("cascade note")).toBeInTheDocument();

    rerender(
      <BaseModal open={true} onClose={vi.fn()} title="Edit block">
        <span>body</span>
      </BaseModal>,
    );

    expect(screen.queryByText("cascade note")).not.toBeInTheDocument();
    expect(screen.getByText("Edit block")).toBeInTheDocument();
  });

  it("renders the children body", () => {
    render(
      <BaseModal open={true} onClose={vi.fn()} title="Edit block">
        <span data-testid="modal-body">body content</span>
      </BaseModal>,
    );

    expect(screen.getByTestId("modal-body")).toBeInTheDocument();
  });
});
