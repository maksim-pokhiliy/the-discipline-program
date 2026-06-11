import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import { render } from "@app/test/render";

import { RowKindPicker } from "./row-kind-picker";

const ALL_TILE_LABELS = ["Exercise", "Rest", "Placeholder", "Rest slot (EMOM)"] as const;

const PICKABLE_TILES = [
  { label: "Exercise", kind: "EXERCISE", hotkey: "e" },
  { label: "Placeholder", kind: "PLACEHOLDER", hotkey: "p" },
  { label: "Rest slot (EMOM)", kind: "REST_SLOT", hotkey: "s" },
] as const;

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
  it("renders all 4 row-kind tiles", () => {
    renderPicker();

    for (const label of ALL_TILE_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders every tile enabled", () => {
    renderPicker();

    for (const label of ALL_TILE_LABELS) {
      expect(getTileButton(label)).toBeEnabled();
    }
  });
});

describe("RowKindPicker pickable tiles (MT-13)", () => {
  it.each(PICKABLE_TILES)(
    "selects $kind on click and confirms it via Continue",
    ({ label, kind }) => {
      const onSelect = vi.fn();
      const onClose = vi.fn();

      renderPicker({ onSelect, onClose });

      fireEvent.click(getTileButton(label));
      fireEvent.click(getContinue());

      expect(onSelect).toHaveBeenCalledWith(kind);
      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );

  it.each(PICKABLE_TILES)(
    "emits onSelect($kind) and closes when its tile is double-clicked",
    ({ label, kind }) => {
      const onSelect = vi.fn();
      const onClose = vi.fn();

      renderPicker({ onSelect, onClose });

      fireEvent.doubleClick(getTileButton(label));

      expect(onSelect).toHaveBeenCalledWith(kind);
      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );

  it.each(PICKABLE_TILES)(
    "selects $kind on the $hotkey hotkey and confirms it on Enter",
    ({ kind, hotkey }) => {
      const onSelect = vi.fn();
      const onClose = vi.fn();

      renderPicker({ onSelect, onClose });

      pressKey(hotkey);
      pressKey("Enter");

      expect(onSelect).toHaveBeenCalledWith(kind);
      expect(onClose).toHaveBeenCalledTimes(1);
    },
  );
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

  it("selects EXERCISE on the e hotkey and confirms it on Enter", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderPicker({ onSelect, onClose });

    pressKey("e");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledWith("EXERCISE");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lets a later hotkey override the prior pick", () => {
    const onSelect = vi.fn();

    renderPicker({ onSelect });

    pressKey("e");
    pressKey("p");
    pressKey("Enter");

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("PLACEHOLDER");
  });
});
