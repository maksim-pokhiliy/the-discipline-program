import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { ComposePrototypeView } from "../../views/compose-prototype-view";

const at = (elements: HTMLElement[], index: number): HTMLElement => {
  const element = elements[index];

  if (element === undefined) {
    throw new Error(`no element at index ${index}`);
  }

  return element;
};

describe("ComposePrototypeView", () => {
  it("renders the Gauntlet blocks B, C and D from the mock seed", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("EMOM 16 / 4 rounds")).toBeInTheDocument();
    expect(screen.getByText("Parallel ladders into AMRAP")).toBeInTheDocument();
    expect(screen.getByText("Intervals, max in remaining")).toBeInTheDocument();
  });

  it("renders compound exercise rows by movement name", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("Pull-up + Dip")).toBeInTheDocument();
  });

  it("renders an axes summary for a cadence container", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("EMOM 1’×4")).toBeInTheDocument();
  });

  it("shows the empty inspector placeholder before a node is selected", () => {
    render(<ComposePrototypeView />);

    expect(screen.getByText("Select a node to edit its axes.")).toBeInTheDocument();
  });

  it("duplicates a block, appending one more block-duplicate affordance", () => {
    render(<ComposePrototypeView />);

    const before = screen.getAllByRole("button", { name: "Duplicate block" }).length;

    fireEvent.click(at(screen.getAllByRole("button", { name: "Duplicate block" }), 0));

    expect(screen.getAllByRole("button", { name: "Duplicate block" })).toHaveLength(before + 1);
  });

  it("deletes a leaf node, removing exactly one delete affordance", () => {
    render(<ComposePrototypeView />);

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    const before = deleteButtons.length;

    fireEvent.click(at(deleteButtons, before - 1));

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(before - 1);
  });

  it("adds an uncommitted exercise row via the picker and renders its setup placeholder", () => {
    render(<ComposePrototypeView />);

    fireEvent.click(at(screen.getAllByRole("button", { name: /\+ row/ }), 0));
    fireEvent.click(screen.getByText("Exercise"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getAllByText("tap to set up…").length).toBeGreaterThan(0);
  });
});
