import EventBusyIcon from "@mui/icons-material/EventBusy";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { ReasonOption } from "./reason-option";

describe("ReasonOption", () => {
  it("renders the title and description", () => {
    render(
      <ReasonOption
        icon={<EventBusyIcon />}
        title="Contacted manually"
        description="I reached out to the athlete"
        selected={false}
      />,
    );

    expect(screen.getByText("Contacted manually")).toBeInTheDocument();
    expect(screen.getByText("I reached out to the athlete")).toBeInTheDocument();
  });

  it("shows the check icon when selected", () => {
    const { container } = render(
      <ReasonOption
        icon={<EventBusyIcon />}
        title="Contacted manually"
        description="desc"
        selected
      />,
    );

    expect(container.querySelector('[data-testid="CheckIcon"]')).not.toBeNull();
  });

  it("does not show the check icon when not selected", () => {
    const { container } = render(
      <ReasonOption
        icon={<EventBusyIcon />}
        title="Contacted manually"
        description="desc"
        selected={false}
      />,
    );

    expect(container.querySelector('[data-testid="CheckIcon"]')).toBeNull();
  });

  it("applies the accent border when selected", () => {
    const { container } = render(
      <ReasonOption
        icon={<EventBusyIcon />}
        title="Contacted manually"
        description="desc"
        selected
      />,
    );
    const button = container.querySelector(".MuiButtonBase-root");

    expect(button).toHaveStyle({ border: `1px solid ${theme.palette.primary.main}` });
  });

  it("renders the badge instead of the check when a badge is provided", () => {
    render(
      <ReasonOption
        icon={<EventBusyIcon />}
        title="Condition cleared"
        description="resolved automatically"
        selected={false}
        badge="Auto"
      />,
    );

    expect(screen.getByText("Auto")).toBeInTheDocument();
  });

  it("disables the control and blocks clicks when disabled", () => {
    const onClick = vi.fn();

    const { container } = render(
      <ReasonOption
        icon={<EventBusyIcon />}
        title="Condition cleared"
        description="resolved automatically"
        selected={false}
        disabled
        badge="Auto"
        onClick={onClick}
      />,
    );
    const button = container.querySelector(".MuiButtonBase-root");

    expect(button).not.toBeNull();

    if (button === null) {
      throw new Error("button node missing");
    }

    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onClick when interactive and clicked", () => {
    const onClick = vi.fn();

    render(
      <ReasonOption
        icon={<EventBusyIcon />}
        title="Contacted manually"
        description="desc"
        selected={false}
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
