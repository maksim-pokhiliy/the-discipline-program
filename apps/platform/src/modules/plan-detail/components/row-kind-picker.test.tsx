import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

import { RowKindPicker } from "./row-kind-picker";

const ALL_TILE_LABELS = [
  "Exercise",
  "Rest",
  "Footnote",
  "Standalone load",
  "Standalone URL",
  "Placeholder",
  "Inner ladder",
  "Rep definition",
  "Rest slot (EMOM)",
] as const;

const DEFERRED_LABELS = ["Footnote", "Placeholder", "Rep definition"] as const;

const getTileButton = (label: string): HTMLButtonElement => {
  const node = screen.getByText(label).closest("button");

  if (!(node instanceof HTMLButtonElement)) {
    throw new Error(`expected a tile button for "${label}"`);
  }

  return node;
};

const getContinue = (): HTMLElement => screen.getByRole("button", { name: "Continue" });

const renderPicker = (props: { onSelect?: (kind: RowKind) => void; onClose?: () => void } = {}) =>
  render(
    <RowKindPicker
      open={true}
      onClose={props.onClose ?? vi.fn()}
      onSelect={props.onSelect ?? vi.fn()}
    />,
  );

const pressKey = (key: string): void => {
  fireEvent.keyDown(window, { key });
};

describe("RowKindPicker tiles (MT-14)", () => {
  it("renders all 9 row-kind tiles", () => {
    renderPicker();

    for (const label of ALL_TILE_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("RowKindPicker deferred tiles (MT-13)", () => {
  it("disables each deferred tile and shows the coming-soon hint", () => {
    renderPicker();

    for (const label of DEFERRED_LABELS) {
      expect(getTileButton(label)).toBeDisabled();
    }

    expect(screen.getAllByText("needs exercise editor — coming soon").length).toBe(
      DEFERRED_LABELS.length,
    );
  });

  it("does not call onSelect when a deferred tile is clicked", () => {
    const onSelect = vi.fn();

    renderPicker({ onSelect });

    fireEvent.click(getTileButton("Footnote"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selects EXERCISE on click and confirms it via Continue now that it is live", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.click(getTileButton("Exercise"));
    fireEvent.click(getContinue());

    expect(onSelect).toHaveBeenCalledWith("EXERCISE");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RowKindPicker Continue gating (MT-13)", () => {
  it("enables Continue at open because REST is the default selection", () => {
    renderPicker();

    expect(getContinue()).toBeEnabled();
  });

  it("emits onSelect(REST) and closes when Continue is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.click(getContinue());

    expect(onSelect).toHaveBeenCalledWith("REST");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RowKindPicker double-click (MT-14)", () => {
  it("emits onSelect for the double-clicked enabled tile and closes", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    fireEvent.doubleClick(getTileButton("Standalone URL"));

    expect(onSelect).toHaveBeenCalledWith("STANDALONE_URL");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RowKindPicker hotkeys (MT-12)", () => {
  it("selects REST on the r hotkey and confirms it on Enter", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    pressKey("r");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledWith("REST");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("selects STANDALONE_URL on the u hotkey and confirms it on Enter", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    pressKey("u");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledWith("STANDALONE_URL");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores a deferred hotkey so selection stays on the prior pick", () => {
    const onSelect = vi.fn();

    renderPicker({ onSelect });

    pressKey("u");
    pressKey("f");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("STANDALONE_URL");
  });
});
