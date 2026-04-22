import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test/render";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the provided message", () => {
    render(<EmptyState message="Nothing here yet" />);

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("does not render a button when action is omitted", () => {
    render(<EmptyState message="Nothing here yet" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the action button with label and icon and invokes onClick when clicked", () => {
    const onClick = vi.fn();

    render(
      <EmptyState
        message="Nothing here yet"
        action={{
          label: "Create item",
          onClick,
          icon: <span data-testid="empty-state-icon">+</span>,
        }}
      />,
    );

    const button = screen.getByRole("button", { name: /Create item/ });

    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("empty-state-icon")).toBeInTheDocument();

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
