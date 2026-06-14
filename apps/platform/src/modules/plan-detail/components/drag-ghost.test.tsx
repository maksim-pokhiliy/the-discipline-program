import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { DragGhost } from "./drag-ghost";

describe("DragGhost", () => {
  it("renders the supplied label", () => {
    render(<DragGhost label="Back Squat" />);

    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });

  it("keeps the label on a single line via noWrap", () => {
    render(<DragGhost label="A very long group label that should not wrap onto two lines" />);

    const label = screen.getByText("A very long group label that should not wrap onto two lines");

    expect(label).toHaveStyle({ whiteSpace: "nowrap" });
  });
});
