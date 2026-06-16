import { alpha } from "@mui/material/styles";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { theme } from "@repo/mui";

import { render } from "../../test/render";

import { RosterList } from "./roster-list";
import { RosterRow } from "./roster-row";

const ROW_SELECTED_TINT = 0.08;

describe("RosterList", () => {
  it("renders an outlined card wrapping its row children", () => {
    const { container } = render(
      <RosterList>
        <RosterRow leading={<span data-testid="lead">A</span>} name="Ada" />
      </RosterList>,
    );
    const card = container.querySelector(".MuiCard-root");

    expect(card).not.toBeNull();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByTestId("lead")).toBeInTheDocument();
  });
});

describe("RosterRow", () => {
  it("renders the leading, name, sub, and trailing slots", () => {
    render(
      <RosterRow
        leading={<span data-testid="lead">L</span>}
        name="Grace Hopper"
        sub={<span data-testid="sub">Plan · Today</span>}
        trailing={<span data-testid="trail">Done</span>}
      />,
    );

    expect(screen.getByTestId("lead")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByTestId("sub")).toBeInTheDocument();
    expect(screen.getByTestId("trail")).toBeInTheDocument();
  });

  it("does not render the sub or trailing wrappers when omitted", () => {
    render(<RosterRow leading={<span>L</span>} name="No Sub" />);

    expect(screen.getByText("No Sub")).toBeInTheDocument();
  });

  it("paints the selected background tint when selected", () => {
    const { container } = render(
      <RosterRow leading={<span>L</span>} name="Selected" selected onClick={vi.fn()} />,
    );
    const row = screen.getByRole("button");

    expect(row).toHaveStyle({
      backgroundColor: alpha(theme.palette.primary.main, ROW_SELECTED_TINT),
    });
    expect(container).toBeTruthy();
  });

  it("does not apply the selected tint when not selected", () => {
    render(<RosterRow leading={<span>L</span>} name="Plain" onClick={vi.fn()} />);
    const row = screen.getByRole("button");

    expect(row).not.toHaveStyle({
      backgroundColor: alpha(theme.palette.primary.main, ROW_SELECTED_TINT),
    });
  });

  it("fires onClick when the row is clicked", () => {
    const onClick = vi.fn();

    render(<RosterRow leading={<span>L</span>} name="Click me" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is not a button when no onClick is provided", () => {
    render(<RosterRow leading={<span>L</span>} name="Static" />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
