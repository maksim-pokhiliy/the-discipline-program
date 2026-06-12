import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "@app/test/render";

import { KindSwitchConfirm } from "./kind-switch-confirm";

describe("KindSwitchConfirm", () => {
  it("renders the discard message and both action labels when open", () => {
    render(<KindSwitchConfirm open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(
      screen.getByText("Switching the repetition kind discards the current setup. Continue?"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch & discard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep editing" })).toBeInTheDocument();
  });

  it("does not render its content when closed", () => {
    render(<KindSwitchConfirm open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(
      screen.queryByText("Switching the repetition kind discards the current setup. Continue?"),
    ).not.toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();

    render(<KindSwitchConfirm open={true} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Switch & discard" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = vi.fn();

    render(<KindSwitchConfirm open={true} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
